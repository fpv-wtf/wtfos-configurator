/* eslint-disable no-restricted-globals */
import { StreamDataView } from "stream-data-view";

import VideoWorkerShared from "./shared";
import { MP4Parser, MP4Writer } from "./mp4";
import { Avc1Box, AvcCBox } from "./mp4/types";

const PROGRESS_UPDATE_INTERVAL = 100;

function avcCBoxToDescription(avcCBox: AvcCBox): ArrayBuffer {
  const stream = new StreamDataView(undefined, true);

  stream.setNextUint8(avcCBox.configurationVersion);
  stream.setNextUint8(avcCBox.profileIndication);
  stream.setNextUint8(avcCBox.profileCompatibility);
  stream.setNextUint8(avcCBox.levelIndication);
  stream.setNextUint8(avcCBox.lengthSizeMinusOne + (63 << 2));

  stream.setNextUint8(avcCBox.sequenceParameterSets.length + (7 << 5));
  for (let i = 0; i < avcCBox.sequenceParameterSets.length; i++) {
    stream.setNextUint16(avcCBox.sequenceParameterSets[i].length);
    for (let j = 0; j < avcCBox.sequenceParameterSets[i].length; j++) {
      stream.setNextUint8(avcCBox.sequenceParameterSets[i][j]);
    }
  }

  stream.setNextUint8(avcCBox.pictureParameterSets.length);
  for (let i = 0; i < avcCBox.pictureParameterSets.length; i++) {
    stream.setNextUint16(avcCBox.pictureParameterSets[i].length);
    for (let j = 0; j < avcCBox.pictureParameterSets[i].length; j++) {
      stream.setNextUint8(avcCBox.pictureParameterSets[i][j]);
    }
  }

  return stream.getBuffer();
}

type ModifyFrameCallback = (frame: ImageBitmap, index: number) => ImageBitmap;

type ProgressInitCallback = (options: {
  expectedFrames: number;
}) => void;

type ProgressCallback = (options: {
  framesDecoded?: number;
  framesDecodedMissing?: number;
  framesEncoded?: number;
  preview?: ImageBitmap;
  queuedForDecode?: number;
  queuedForEncode?: number;
  inEncoderQueue?: number;
  inDecoderQueue?: number;
}) => void;

export interface ProcessorOptions {
  modifyFrame: ModifyFrameCallback;
  progressInit: ProgressInitCallback;
  progressUpdate: ProgressCallback;
}

interface DecodedFrame {
  index: number;
  image?: ImageBitmap
  sync: boolean;
}

interface EncodedFrame {
  data: ArrayBuffer;
  timestamp: number;
  sync: boolean;
}

export class Processor {
  decoder?: VideoDecoder;
  encoder?: VideoEncoder;

  inMp4?: MP4Parser;
  outMp4?: MP4Writer;

  expectedFrames: number = 0;
  framesDecoded: number = 0;
  framesDecodedMissing: number = 0;
  framesEncoded: number = 0;
  queuedForDecode: number = 0;
  queuedForEncode: number = 0;

  modifyFrame: ModifyFrameCallback;
  progressInit: ProgressInitCallback;
  progressUpdate: ProgressCallback;

  processResolve?: () => void;
  processReject?: (reason?: any) => void;

  progressUpdateIntervalHandle?: number;

  decodedFrames: Record<number, DecodedFrame> = {};
  encodedFrames: EncodedFrame[] = [];

  constructor(options: ProcessorOptions) {
    this.modifyFrame = options.modifyFrame;
    this.progressInit = options.progressInit;
    this.progressUpdate = options.progressUpdate;

    this.sendProgressUpdate = this.sendProgressUpdate.bind(this);
  }

  async open(file: File, outHandle: FileSystemFileHandle) {
    this.reset();

    this.inMp4 = new MP4Parser(file);
    await this.inMp4.parse();

    this.outMp4 = new MP4Writer(outHandle);
    await this.outMp4.open();

    return {
      width: this.inMp4.moov!.trak[0].tkhd.width,
      height: this.inMp4.moov!.trak[0].tkhd.height,
    };
  }

  process(options: { width: number; height: number }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.processResolve = resolve;
      this.processReject = reject;

      try {
        const avc1box = this.inMp4!.moov!.trak[0].mdia.minf.stbl.stsd
          .entries[0] as Avc1Box;
        const codec =
          "avc1." +
          avc1box.avcC.profileIndication.toString(16).padStart(2, "0") +
          avc1box.avcC.profileCompatibility.toString(16).padStart(2, "0") +
          avc1box.avcC.levelIndication.toString(16).padStart(2, "0");

        this.decoder!.configure({
          codec: codec,
          codedWidth: this.inMp4!.moov!.trak[0].tkhd.width,
          codedHeight: this.inMp4!.moov!.trak[0].tkhd.height,
          description: avcCBoxToDescription(
            (this.inMp4!.moov!.trak[0].mdia.minf.stbl.stsd.entries[0] as Avc1Box)
              .avcC
          ),
          optimizeForLatency: false,
        });
      } catch (e: any) {
        throw new VideoWorkerShared.DecoderConfigureError(e);
      }

      try {
        let bitrate =
          (this.inMp4!.mdat!.header!.size * 8 * this.inMp4!.moov!.mvhd.timescale) /
          this.inMp4!.moov!.mvhd.duration;
        bitrate = Math.ceil(bitrate / 5_000_000) * 5_000_000;

        this.encoder!.configure({
          bitrate: bitrate,
          codec: "avc1.42003d",
          framerate: 60,
          height: options.height,
          latencyMode: "quality",
          scalabilityMode: "L1T2",
          width: options.width,
        });
      } catch (e: any) {
        throw new VideoWorkerShared.EncoderConfigureError(e);
      }

      this.outMp4?.setDisplaySize({
        width: options.width,
        height: options.height,
      });

      this.outMp4?.setFramerate(60);

      this.expectedFrames = this.inMp4!.moov!.trak[0].mdia.minf.stbl.stsz.sampleCount;
      this.decodedFrames = {};

      this.progressInit({
        expectedFrames: this.expectedFrames,
      });

      this.progressUpdateIntervalHandle = self.setInterval(this.sendProgressUpdate, PROGRESS_UPDATE_INTERVAL);

      this.processSamples();
    });
  }

  private reset() {
    if (this.encoder) {
      this.encoder.close();
    }

    this.encoder = new VideoEncoder({
      output: this.handleEncodedFrame.bind(this),
      error: this.handleEncoderError.bind(this),
    });

    if (this.decoder) {
      this.decoder.close();
    }

    this.decoder = new VideoDecoder({
      output: this.handleDecodedFrame.bind(this),
      error: this.handleDecoderError.bind(this),
    });

    this.expectedFrames = 0;
    this.framesDecoded = 0;
    this.framesDecodedMissing = 0;
    this.framesEncoded = 0;
    this.queuedForDecode = 0;
    this.queuedForEncode = 0;

    this.processResolve = undefined;
    this.processReject = undefined;

    if (this.progressUpdateIntervalHandle) {
      clearInterval(this.progressUpdateIntervalHandle);
    }
  }

  private async processSamples() {
    let lastSampleIndex = 0;
    while (lastSampleIndex < this.expectedFrames) {
      // Load samples up to next keyframe.
      const sampleChunks = [];
      for (let sampleIndex = lastSampleIndex; sampleIndex < this.expectedFrames; sampleIndex++) {
        const sample = await this.inMp4!.getSample(sampleIndex);
        sampleChunks.push({
          index: sampleIndex,
          data: sample.data.buffer,
          sync: sample.sync,
        });

        if (sampleIndex + 1 < this.expectedFrames && this.inMp4!.isSampleSync(sampleIndex + 1)) {
          break;
        }
      }

      // Prepare expected frames object, which the callback will toot into.
      this.decodedFrames = {};
      for (const chunk of sampleChunks) {
        this.decodedFrames[chunk.index] = {
          index: chunk.index,
          image: undefined,
          sync: chunk.sync,
        }
      }

      // Enqueue samples for decoding.
      for (const chunk of sampleChunks) {
        const encodedChunk = new EncodedVideoChunk({
          type: chunk.sync ? "key" : "delta",
          timestamp: chunk.index,
          duration: 16670,
          data: chunk.data,
        });

        this.decoder!.decode(encodedChunk);
        this.queuedForDecode++;
      }

      // Wait for all samples to be decoded.
      await this.decoder!.flush();

      // DJI recordings straight from the goggles have all frames in sequence.
      // Processed files may need reordering of the frames described in the ctts box.
      const orderedFrames = this.reorderFrames(lastSampleIndex);

      // Modify and enque frames for encoding.
      this.encodedFrames = [];
      for (const [index, entry] of orderedFrames.entries()) {
        if (!entry.image) {
          console.error(`Frame ${entry.index} was never decoded!`);
          this.framesDecodedMissing++;
          continue;
        }

        const modifiedFrame = this.modifyFrame(entry.image!, entry.index);
        const frame = new VideoFrame(modifiedFrame, {
          duration: 16670,
          timestamp: entry.index,
        });

        // Send first frame as preview. This needs to happen after constructing the frame otherwise
        // it complains that "the image source is detached" which is completely ungooglable.
        if (index === 0) {
          this.progressUpdate({
            preview: modifiedFrame
          })
        }

        this.encoder!.encode(frame, { keyFrame: entry.sync });
        this.queuedForEncode++;
        frame.close();
      }

      // Wait for all frames to be encoded.
      await this.encoder!.flush();

      // Write encoded frames to output.
      for (const frame of this.encodedFrames) {
        this.outMp4!.writeSample(frame.data, frame.sync);
      }

      lastSampleIndex += sampleChunks.length
    }

    await this.outMp4!.close();
    this.sendProgressUpdate();
    this.processResolve!();
  }

  private reorderFrames(lastSampleIndex: number) {
    const orderedFrames = []
    const ctts = this.inMp4!.moov!.trak[0].mdia.minf.stbl.ctts;

    if (!ctts) {
      // No ctts box found: no reordering needed
      for (let i = 0; i < Object.keys(this.decodedFrames).length; i++) {
        orderedFrames.push(this.decodedFrames[lastSampleIndex + i])
      }
    } else {
      // Reorder frames according to ctts table
      const sampleDelta = this.inMp4!.moov!.trak[0].mdia.minf.stbl.stts.entries[0].sampleDelta;
      const initialOffset = ctts.sampleOffsets[0] / sampleDelta

      for (let i = 0; i < Object.keys(this.decodedFrames).length; i++) {
        const frameNumber = lastSampleIndex + i

        let j = 0;
        let frame = 0;
        while (frameNumber >= frame) {
          j++
          frame = ctts.sampleCounts.slice(0, j).reduce((acc, e) => acc + e, 0)
        }

        const newPosition = i + ctts.sampleOffsets[j - 1] / sampleDelta - initialOffset;
        orderedFrames[newPosition] = Object.assign({}, this.decodedFrames[lastSampleIndex + i], {index: lastSampleIndex + newPosition})
      }
    }

    return orderedFrames;
  }

  private async handleDecodedFrame(frame: VideoFrame) {
    this.framesDecoded++;
    this.decodedFrames[frame.timestamp!].image = await createImageBitmap(frame);
    frame.close();
  }

  private handleEncodedFrame(
    chunk: EncodedVideoChunk,
    metadata: EncodedVideoChunkMetadata
  ) {
    this.framesEncoded++;

    const buffer = new ArrayBuffer(chunk.byteLength);
    chunk.copyTo(buffer);
    this.encodedFrames.push({
      data: buffer,
      sync: chunk.type === "key",
      timestamp: chunk.timestamp,
    });

    // avcC is only available on the first frame.
    if (chunk.timestamp === 0) {
      this.outMp4!.setAvcC(metadata.decoderConfig?.description!);
    }
  }

  private handleDecoderError(e: Error) {
    this.processReject!(new VideoWorkerShared.DecoderError(e.message));
    throw e;
  }

  private handleEncoderError(e: Error) {
    this.processReject!(new VideoWorkerShared.EncoderError(e.message));
    throw e;
  }

  private sendProgressUpdate() {
    this.progressUpdate({
      framesDecoded: this.framesDecoded,
      framesDecodedMissing: this.framesDecodedMissing,
      framesEncoded: this.framesEncoded,
      queuedForDecode: this.queuedForDecode,
      queuedForEncode: this.queuedForEncode,
      inDecoderQueue: this.decoder?.decodeQueueSize,
      inEncoderQueue: this.encoder?.encodeQueueSize,
    });
  }
}

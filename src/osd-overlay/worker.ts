/// <reference lib="webworker" />

import VideoWorkerShared from "./shared";
import { Processor } from "./processor";
import {
  Font,
  FontPack,
  FontPackFiles,
  TILES_PER_PAGE,
} from "./fonts";
import { OsdReader } from "./osd";
import { SrtReader } from "./srt";

const MAX_DISPLAY_X = 60;
const MAX_DISPLAY_Y = 22;

export class VideoWorker {
  readonly processor: Processor;

  chromaKey: boolean = false;
  chromaKeyColor: string = "#ff00ff";

  fontPack?: FontPack;
  osdReader?: OsdReader;
  srtReader?: SrtReader;

  lastOsdIndex: number = 0;

  wide: boolean = false;
  hd: boolean = false;
  outWidth?: number;
  outHeight?: number;

  osdCanvas?: OffscreenCanvas;
  osdCtx?: OffscreenCanvasRenderingContext2D;
  frameCanvas?: OffscreenCanvas;
  frameCtx?: OffscreenCanvasRenderingContext2D;

  constructor() {
    this.processor = new Processor({
      modifyFrame: this.modifyFrame.bind(this),
      progressInit: this.progressInit.bind(this),
      progressUpdate: this.progressUpdate.bind(this),
    });

    addEventListener("message", this.onMessage.bind(this)); // eslint-disable-line no-restricted-globals
  }

  async start(options: {
    chromaKey: boolean,
    chromaKeyColor: string,

    fontFiles: FontPackFiles,
    osdFile: File,
    srtFile: File,
    outHandle: FileSystemFileHandle,
    videoFile: File,
  }) {
    this.chromaKey = options.chromaKey;
    this.chromaKeyColor = options.chromaKeyColor;

    this.osdReader = await OsdReader.fromFile(options.osdFile);

    if (options.srtFile) {
      this.srtReader = await SrtReader.fromFile(options.srtFile);
    }

    this.fontPack = await Font.fromFiles(options.fontFiles);

    const {
      width,
      height,
    } = await this.processor.open(options.videoFile, options.outHandle);

    if (width === 1280 && height === 720) {
      this.wide = true;
    }

    if (this.osdReader!.header.config.fontWidth === 24) {
      this.hd = true;
    }

    let outWidth: number;
    let outHeight: number;
    if (this.wide || this.hd) {
      outWidth = 1280;
      outHeight = 720;
    } else {
      outWidth = width;
      outHeight = height;
    }

    this.outWidth = outWidth;
    this.outHeight = outHeight;

    this.osdCanvas = new OffscreenCanvas(
      this.osdReader!.header.config.fontWidth *
        this.osdReader!.header.config.charWidth,
      this.osdReader!.header.config.fontHeight *
        this.osdReader!.header.config.charHeight
    );
    this.osdCtx = this.osdCanvas.getContext("2d")!;

    this.frameCanvas = new OffscreenCanvas(this.outWidth!, this.outHeight!);
    this.frameCtx = this.frameCanvas.getContext("2d")!;

    this.lastOsdIndex = 0;

    try {
      await this.processor.process({
        width: outWidth,
        height: outHeight,
      });

      this.postMessage({ type: VideoWorkerShared.MessageType.COMPLETE });
    } catch (e: any) {
      this.postMessage({
        type: VideoWorkerShared.MessageType.ERROR,
        error: e,
      });
      throw e;
    }
  }

  modifyFrame(frame: ImageBitmap, frameIndex: number): ImageBitmap {
    const frameCanvas = this.frameCanvas!;
    const frameCtx = this.frameCtx!;
    const osdCanvas = this.osdCanvas!;
    const osdCtx = this.osdCtx!;

    frameCtx.fillStyle = this.chromaKey ? this.chromaKeyColor : "black";
    frameCtx.fillRect(0, 0, frameCanvas.width, frameCanvas.height);
    osdCtx.clearRect(0, 0, osdCanvas.width, osdCanvas.height);

    if (!this.chromaKey) {
      let frameXOffset: number;
      if (this.hd || this.wide) {
        frameXOffset = (this.outWidth! - frame.width) / 2;
      } else {
        frameXOffset = 0;
      }
      frameCtx.drawImage(frame, frameXOffset, 0);
    }

    if (this.lastOsdIndex < this.osdReader!.frames.length - 1) {
      const nextOsdIndex = this.lastOsdIndex + 1;
      const nextOsdFrame = this.osdReader!.frames[nextOsdIndex];

      if (frameIndex >= nextOsdFrame.frameNumber) {
        this.lastOsdIndex = nextOsdIndex;
      }
    }

    if (this.srtReader) {
      // If a srt file is supplied, render the DJI goggle osd elements
      const drawText = (osdCtx: OffscreenCanvasRenderingContext2D, text: string, x: number, y: number, bigFont = false) => {
        osdCtx.font = `${bigFont ? "30px" : "26px"} calibri`;
        osdCtx.strokeStyle = "#333333";
        osdCtx.lineWidth = 4;
        osdCtx.strokeText(text, x, y);
        osdCtx.fillStyle = "white";
        osdCtx.fillText(text, x, y);
      };

      const currentFrameInMilliseconds = frameIndex * 1000 / 60;
      let srtFrame = this.srtReader.frames.find((it) => it.start <= currentFrameInMilliseconds && it.end > currentFrameInMilliseconds);

      if (currentFrameInMilliseconds < this.srtReader.frames[0].start) {
        // DJI subtitles don't start at 0 milliseconds
        // Take the first one as a filler at the start
        srtFrame = this.srtReader.frames[0];
      } else if (currentFrameInMilliseconds > this.srtReader.frames[this.srtReader.frames.length - 1].end) {
        // Show the last subtitle in case there is more video than subtitles
        srtFrame = this.srtReader.frames[this.srtReader.frames.length - 1];
      }

      if (srtFrame) {
        drawText(osdCtx, srtFrame.ch, 120, 785, true);
        drawText(osdCtx, srtFrame.delay, 1190, 710);
        drawText(osdCtx, srtFrame.bitrate, 1320, 710);
        drawText(osdCtx, srtFrame.uavBat, 1060, 785, true);
        drawText(osdCtx, srtFrame.flightTime, 1200, 785, true);
        drawText(osdCtx, srtFrame.glsBat, 1350, 785, true);
      }
    }

    const osdFrame = this.osdReader!.frames[this.lastOsdIndex];
    for (let y = 0; y < MAX_DISPLAY_Y; y++) {
      for (let x = 0; x < MAX_DISPLAY_X; x++) {
        const osdFrameIndex = y + MAX_DISPLAY_Y * x;
        const osdFrameChar = osdFrame.frameData[osdFrameIndex];

        let font: Font;
        if (this.hd) {
          font =
            osdFrameChar < TILES_PER_PAGE
              ? this.fontPack!.hd1
              : this.fontPack!.hd2;
        } else {
          font =
            osdFrameChar < TILES_PER_PAGE
              ? this.fontPack!.sd1
              : this.fontPack!.sd2;
        }

        osdCtx.drawImage(
          font.getTile(osdFrameChar % TILES_PER_PAGE),
          x * this.osdReader!.header.config.fontWidth,
          y * this.osdReader!.header.config.fontHeight
        );
      }
    }

    // Try fit vertically, then try horizontally.
    let osdScale: number;
    if (
      frameCanvas.height / osdCanvas.height <
      frameCanvas.width / osdCanvas.width
    ) {
      osdScale = frameCanvas.height / osdCanvas.height;
    } else {
      osdScale = frameCanvas.width / osdCanvas.width;
    }

    const osdWidth = osdCanvas.width * osdScale;
    const osdHeight = osdCanvas.height * osdScale;

    const osdXOffset = (frameCanvas.width - osdWidth) / 2;
    const osdYOffset = (frameCanvas.height - osdHeight) / 2;

    frameCtx.drawImage(osdCanvas, osdXOffset, osdYOffset, osdWidth, osdHeight);

    return frameCanvas.transferToImageBitmap();
  }

  progressInit(options: {
    expectedFrames: number;
  }) {
    this.postMessage({
      type: VideoWorkerShared.MessageType.PROGRESS_INIT,
      ...options,
    });
  }

  progressUpdate(options: {
    framesDecoded?: number;
    framesDecodedMissing?: number;
    framesEncoded?: number;
    preview?: ImageBitmap;
    queuedForDecode?: number;
    queuedForEncode?: number;
    inEncoderQueue?: number;
    inDecoderQueue?: number;
  }) {
    this.postMessage(
      {
        type: VideoWorkerShared.MessageType.PROGRESS_UPDATE,
        ...options,
      },
      [...(options.preview ? [options.preview] : [])]
    );
  }

  onMessage(event: MessageEvent<VideoWorkerShared.Message>) {
    const message = event.data;
    switch (message.type) {
      case VideoWorkerShared.MessageType.START: {
        this.start({
          chromaKey: message.chromaKey,
          chromaKeyColor: message.chromaKeyColor,
          fontFiles: message.fontFiles,
          osdFile: message.osdFile,
          srtFile: message.srtFile,
          outHandle: message.outHandle,
          videoFile: message.videoFile,
        });
        break;
      }

      default: {
        throw new Error("Unknown message type received");
      }
    }
  }

  private postMessage(message: VideoWorkerShared.Message, transfer?: Transferable[]) {
    if (transfer) {
      postMessage(message, transfer);
    } else {
      postMessage(message);
    }
  }
}

new VideoWorker();

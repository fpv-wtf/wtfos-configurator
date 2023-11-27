import { FileStreamReader } from "./io/reader";
import { FileStreamWriter } from "./io/writer";
import {
  Avc1Box,
  AvcCBox,
  Box,
  DinfBox,
  DrefBox,
  FtypBox,
  HdlrBox,
  MdatBox,
  MdhdBox,
  MdiaBox,
  MinfBox,
  MoovBox,
  MvhdBox,
  StblBox,
  StcoBox,
  StscBox,
  StsdBox,
  StssBox,
  StszBox,
  SttsBox,
  TkhdBox,
  TrakBox,
  UrlBox,
  VmhdBox,
} from "./types";
import { getMp4Time } from "./utils";
import { parseBox } from "./parsers";
import {
  writeBox,
  MdatBoxStreamWriter,
} from "./writers";

export class MP4Parser {
  private readonly stream: FileStreamReader;
  mdat?: MdatBox;
  moov?: MoovBox;

  constructor(file: File) {
    this.stream = new FileStreamReader(file);
  }

  async parse(): Promise<void> {
    const ftyp = await this.parseBox();
    if (ftyp.type !== "ftyp") {
      throw new Error("Expected ftyp box at start of file. Not an MP4?");
    }

    let mdat: MdatBox | undefined;
    let moov: MoovBox | undefined;

    while (!this.stream.eof) {
      const box = await this.parseBox();

      switch (box.type) {
        case "mdat":
          mdat = box;
          break;
        case "moov":
          moov = box;
          break;
        default:
          break;
      }
    }

    if (!mdat || !moov) {
      throw new Error("Missing mdat or moov box");
    }

    this.mdat = mdat;
    this.moov = moov;
  }

  async getSample(sampleNumber: number): Promise<{
    data: Uint8Array;
    sync: boolean;
  }> {
    const stbl = this.moov!.trak[0].mdia.minf.stbl;
    const stsz = stbl.stsz;
    const stco = stbl.stco ? stbl.stco : stbl.co64;

    const sampleSize = stsz.sampleSizes[sampleNumber];

    let chunkOffset = stco!.chunkOffsets[0];
    let sampleOffset = chunkOffset;
    for (let i = 0; i < sampleNumber; i++) {
      sampleOffset += stbl.stsz.sampleSizes[i];
    }

    this.stream.seek(sampleOffset);
    return {
      data: await this.stream.getNextBytes(sampleSize),
      sync: this.isSampleSync(sampleNumber),
    };
  }

  isSampleSync(sampleNumber: number): boolean {
    const stbl = this.moov!.trak[0].mdia.minf.stbl;
    return stbl.stss.sampleNumbers.includes(sampleNumber + 1);
  }

  private async parseBox(): Promise<Box> {
    return await parseBox(this.stream);
  }
}

export class MP4Writer {
  private readonly stream: FileStreamWriter;
  private readonly mdat: MdatBoxStreamWriter;
  private avcC?: AvcCBox;

  private sampleCount = 0;
  private syncSamples: number[] = [];
  private sampleSizes: number[] = [];

  private displaySize?: { width: number; height: number };
  private frameRate: number = 60;

  constructor(file: FileSystemFileHandle) {
    this.stream = new FileStreamWriter(file);
    this.mdat = new MdatBoxStreamWriter(this.stream);
  }

  async open(): Promise<void> {
    const ftyp: FtypBox = {
      type: "ftyp",
      majorBrand: "isom",
      minorVersion: 0,
      compatibleBrands: ["mp41", "avc1", "isom"],
    };

    await writeBox(this.stream, ftyp);
    await this.mdat.open();
  }

  async writeSample(data: Blob | BufferSource, sync: boolean) {
    await this.mdat.write(data);

    if (sync) {
      this.syncSamples.push(this.sampleCount + 1);
    }

    this.sampleSizes.push(data instanceof Blob ? data.size : data.byteLength);
    this.sampleCount++;
  }

  setAvcC(avcCStruct: ArrayBuffer | ArrayBufferView) {
    // TODO: Make a nice stream view for this.
    let view: DataView;
    if (avcCStruct instanceof ArrayBuffer) {
      view = new DataView(avcCStruct);
    } else {
      view = new DataView(
        avcCStruct.buffer,
        avcCStruct.byteOffset,
        avcCStruct.byteLength
      );
    }

    let avcC: AvcCBox = {
      type: "avcC",
      configurationVersion: view.getUint8(0),
      profileIndication: view.getUint8(1),
      profileCompatibility: view.getUint8(2),
      levelIndication: view.getUint8(3),
      lengthSizeMinusOne: view.getUint8(4) & 0x3,
      sequenceParameterSets: [],
      pictureParameterSets: [],
    } as AvcCBox;

    let offset: number = 5;

    const spsCount = view.getUint8(offset) & 0x1f;
    offset += 1;

    const sps = [];
    for (let i = 0; i < spsCount; i++) {
      const spsLength = view.getUint16(offset);
      offset += 2;

      const spsData = new Uint8Array(
        view.buffer,
        view.byteOffset + offset,
        spsLength
      );
      sps.push(spsData);
      offset += spsLength;
    }

    const ppsCount = view.getUint8(offset);
    offset += 1;

    const pps = [];
    for (let i = 0; i < ppsCount; i++) {
      const ppsLength = view.getUint16(offset);
      offset += 2;

      const ppsData = new Uint8Array(
        view.buffer,
        view.byteOffset + offset,
        ppsLength
      );
      pps.push(ppsData);
      offset += ppsLength;
    }

    avcC.sequenceParameterSets = sps;
    avcC.pictureParameterSets = pps;

    this.avcC = avcC;
  }

  setDisplaySize(options: { width: number; height: number }) {
    this.displaySize = {
      width: options.width,
      height: options.height,
    };
  }

  setFramerate(framerate: number) {
    this.frameRate = framerate;
  }

  async close() {
    await this.mdat.close();

    const moov: MoovBox = {
      type: "moov",
      mvhd: this.getMvhdBox(),
      trak: [this.getTrakBox()],
    };

    await writeBox(this.stream, moov);
    await this.stream.close();
  }

  private getTrakBox(): TrakBox {
    return {
      type: "trak",
      tkhd: this.getTkhdBox(),
      mdia: this.getMdiaBox(),
    };
  }

  private getTkhdBox(): TkhdBox {
    const now = new Date();
    const nowMp4Time = getMp4Time(now);

    return {
      type: "tkhd",
      fullBoxHeader: {
        version: 0,
        flags: 0x3, // Enabled and in movie
      },
      alternateGroup: 0,
      creationTime: nowMp4Time,
      duration: Math.floor((this.sampleCount * 1000) / this.frameRate),
      width: this.displaySize!.width,
      height: this.displaySize!.height,
      layer: 0,
      matrix: [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000],
      modificationTime: nowMp4Time,
      trackId: 1,
      volume: 0,
    };
  }

  private getMvhdBox(): MvhdBox {
    const now = new Date();
    const nowMp4Time = getMp4Time(now);

    return {
      type: "mvhd",
      fullBoxHeader: {
        version: 0,
        flags: 0,
      },
      duration: Math.floor((this.sampleCount * 1000) / this.frameRate),
      creationTime: nowMp4Time,
      modificationTime: nowMp4Time,
      timescale: 1000,
      rate: 0x00010000,
      volume: 0x0100,
      matrix: [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000],
      nextTrackId: 2,
    };
  }

  private getMdiaBox(): MdiaBox {
    return {
      type: "mdia",
      hdlr: {
        type: "hdlr",
        fullBoxHeader: {
          version: 0,
          flags: 0,
        },
        handlerType: "vide",
        name: "VideoHandler",
      } as HdlrBox,
      minf: this.getMinfBox(),
      mdhd: this.getMdhdBox(),
    } as MdiaBox;
  }

  private getMdhdBox(): MdhdBox {
    const now = new Date();
    const nowMp4Time = getMp4Time(now);

    return {
      type: "mdhd",
      fullBoxHeader: {
        version: 0,
        flags: 0,
      },
      creationTime: nowMp4Time,
      duration: this.sampleCount,
      language: "",
      modificationTime: nowMp4Time,
      timescale: this.frameRate,
    };
  }

  private getMinfBox(): MinfBox {
    const stbl = this.getStblBox();
    const dinf = this.getDinfBox();

    return {
      type: "minf",
      dinf,
      stbl,
      vmhd: {
        type: "vmhd",
        fullBoxHeader: {
          version: 0,
          flags: 1,
        },
        graphicsMode: 0,
        opColor: [0, 0, 0],
      } as VmhdBox,
    };
  }

  private getDinfBox(): DinfBox {
    // Always reports that the data is in the same file.
    return {
      type: "dinf",
      dref: {
        type: "dref",
        fullBoxHeader: {
          version: 0,
          flags: 0,
        },
        entries: [
          {
            type: "url ",
            fullBoxHeader: {
              version: 0,
              flags: 1,
            },
            location: "",
          } as UrlBox,
        ],
      } as DrefBox,
    } as DinfBox;
  }

  private getStblBox(): StblBox {
    const stco: StcoBox = {
      type: "stco",
      fullBoxHeader: {
        version: 0,
        flags: 0,
      },
      chunkOffsets: [this.mdat.dataStartOffset],
    };

    const stsc: StscBox = {
      type: "stsc",
      fullBoxHeader: {
        version: 0,
        flags: 0,
      },
      entries: [
        {
          firstChunk: 1,
          samplesPerChunk: this.sampleCount,
          sampleDescriptionIndex: 1,
        },
      ],
    };

    const stsd: StsdBox = {
      type: "stsd",
      fullBoxHeader: {
        version: 0,
        flags: 0,
      },
      entries: [
        {
          type: "avc1",
          dataReferenceIndex: 1,
          width: this.displaySize!.width,
          height: this.displaySize!.height,
          horizontalResolution: 0x00480000,
          verticalResolution: 0x00480000,
          frameCount: 1,
          compressorName: "mp4.ts",
          depth: 24,
          avcC: this.avcC!,
        } as Avc1Box,
      ],
    };

    const stss: StssBox = {
      type: "stss",
      fullBoxHeader: {
        version: 0,
        flags: 0,
      },
      sampleNumbers: this.syncSamples,
    };

    const stsz: StszBox = {
      type: "stsz",
      fullBoxHeader: {
        version: 0,
        flags: 0,
      },
      sampleCount: this.sampleCount,
      sampleSizes: this.sampleSizes,
    };

    const stts: SttsBox = {
      type: "stts",
      fullBoxHeader: {
        version: 0,
        flags: 0,
      },
      entries: [
        {
          sampleCount: this.sampleCount,
          sampleDelta: 1,
        },
      ],
    };

    const stbl: StblBox = {
      type: "stbl",
      stco,
      stsc,
      stsd,
      stss,
      stsz,
      stts,
    };

    return stbl;
  }
}

import { FileStreamReader } from "./io/reader";
import {
  Avc1Box,
  AvcCBox,
  BaseBox,
  BaseFullBox,
  Box,
  BoxHeader,
  BoxType,
  Co64Box,
  DinfBox,
  DrefBox,
  FtypBox,
  FullBoxHeader,
  HdlrBox,
  MdatBox,
  MdhdBox,
  MdiaBox,
  MinfBox,
  MoovBox,
  MvhdBox,
  SampleEntryBox,
  StblBox,
  StcoBox,
  StscBox,
  StsdBox,
  StssBox,
  StszBox,
  SttsBox,
  TkhdBox,
  TrakBox,
  UdtaBox,
  UnknownBox,
  UrlBox,
  UrnBox,
  VmhdBox,
  CttsBox,
} from "./types";

export async function parseBox(stream: FileStreamReader): Promise<Box> {
  const startOffset = stream.offset;

  let size = await stream.getNextUint32();
  const type = await stream.getNextString(4);

  if (size === 0) {
    size = stream.size - startOffset;
    console.debug(
      `${type} box has size 0, must continue until end of file: ${size}`
    );
  } else if (size === 1) {
    // Not actually 64-bits but 9007TB is enough for any one box, I'm sure.
    size = Number(await stream.getNextUint64());
    console.debug(`${type} box has big size: ${size}`);
  }

  const boxParsers: Record<
    string,
    new (
      stream: FileStreamReader,
      startOffset: number,
      size: number,
      type: string
    ) => BoxParser<Box>
  > = {
    "url ": UrlBoxParser,
    "urn ": UrnBoxParser,
    avc1: Avc1BoxParser,
    avcC: AvcCBoxParser,
    co64: Co64BoxParser,
    dinf: DinfBoxParser,
    dref: DrefBoxParser,
    ftyp: FtypBoxParser,
    hdlr: HdrlBoxParser,
    mdat: MdatBoxParser,
    mdhd: MdhdBoxParser,
    mdia: MdiaBoxParser,
    minf: MinfBoxParser,
    moov: MoovBoxParser,
    mvhd: MvhdBoxParser,
    stbl: StblBoxParser,
    stco: StcoBoxParser,
    stsc: StscBoxParser,
    stsd: StsdBoxParser,
    stss: StssBoxParser,
    stsz: StszBoxParser,
    stts: SttsBoxParser,
    tkhd: TkhdBoxParser,
    trak: TrakBoxParser,
    udta: UdtaBoxParser,
    vmhd: VmhdBoxParser,
    ctts: CttsBoxParser,
  };

  let parser: BoxParser<Box>;
  if (boxParsers[type]) {
    parser = new boxParsers[type](stream, startOffset, size, type);
  } else {
    console.warn(
      `No parser available for %c${type}`,
      "text-decoration: underline"
    );
    parser = new UnknownBoxParser(stream, startOffset, size, type);
  }

  return await parser.parse();
}

abstract class BoxParser<T extends BaseBox> {
  protected readonly stream: FileStreamReader;
  protected readonly size: number;
  protected readonly type: string;
  protected readonly startOffset: number;

  protected readonly header: BoxHeader;

  constructor(
    stream: FileStreamReader,
    startOffset: number,
    size: number,
    type: string
  ) {
    this.stream = stream;
    this.startOffset = startOffset;
    this.size = size;
    this.type = type;

    this.header = this.getHeader();
  }

  private getHeader(): BoxHeader {
    const endOffset = this.startOffset + this.size;

    return {
      size: this.size,
      type: this.type,

      startOffset: this.startOffset,
      endOffset,
    };
  }

  protected async getChildBoxes(): Promise<Partial<Record<BoxType, Box[]>>> {
    const boxes: Partial<Record<BoxType, Box[]>> = {};

    while (this.stream.offset < this.header.endOffset) {
      const box = await this.getNextChildBox();

      if (box.type === "unknown") {
        console.warn(
          `Child box %c${box.header!.type}%c in %c${
            this.type
          }%c is unknown, ignoring.`,
          "text-decoration: underline",
          "text-decoration: none",
          "text-decoration: underline",
          "text-decoration: none"
        );
      }

      if (!(box.type in boxes)) {
        boxes[box.type] = [];
      }

      boxes[box.type]!.push(box);
    }

    return boxes;
  }

  protected async getNextChildBox(): Promise<Box> {
    return await parseBox(this.stream);
  }

  protected seekToEnd(): void {
    if (this.stream.offset !== this.header.endOffset) {
      const diff = this.header.endOffset - this.stream.offset;
      console.warn(
        `Box %c${this.header.type}%c was not fully parsed! Stopped ${diff}B early.`,
        "text-decoration: underline",
        "text-decoration: none",
        this.header
      );
    }

    this.stream.seek(this.header.endOffset);
  }

  abstract parse(): Promise<T>;
}

abstract class SimpleBoxParser<T extends BaseBox> extends BoxParser<T> {
  async parse(): Promise<T> {
    const box = await this.parseBox(this.header);
    this.seekToEnd();
    return box;
  }

  protected abstract parseBox(header: BoxHeader): Promise<T>;
}

abstract class FullBoxParser<T extends BaseFullBox> extends BoxParser<T> {
  protected async getFullBoxHeader() {
    const version = await this.stream.getNextUint8();
    const flags =
      ((await this.stream.getNextUint8()) << 16) |
      ((await this.stream.getNextUint8()) << 8) |
      (await this.stream.getNextUint8());

    return {
      version,
      flags,
    };
  }

  async parse(): Promise<T> {
    const fullBoxHeader = await this.getFullBoxHeader();
    const box = await this.parseBox(this.header, fullBoxHeader);
    this.seekToEnd();
    return box;
  }

  protected abstract parseBox(
    header: BoxHeader,
    fullHeader: FullBoxHeader
  ): Promise<T>;
}

class FtypBoxParser extends SimpleBoxParser<FtypBox> {
  async parseBox(header: BoxHeader): Promise<FtypBox> {
    const majorBrand = await this.stream.getNextString(4);
    const minorVersion = await this.stream.getNextUint32();
    const compatibleBrands = [];

    while (this.stream.offset < header.endOffset) {
      compatibleBrands.push(await this.stream.getNextString(4));
    }

    return {
      type: "ftyp",
      header,
      majorBrand,
      minorVersion,
      compatibleBrands,
    };
  }
}

class MdatBoxParser extends SimpleBoxParser<MdatBox> {
  async parseBox(header: BoxHeader): Promise<MdatBox> {
    this.stream.seek(this.header.endOffset);

    return {
      type: "mdat",
      header,
    };
  }
}

class MoovBoxParser extends SimpleBoxParser<MoovBox> {
  async parseBox(header: BoxHeader): Promise<MoovBox> {
    const childBoxes = await this.getChildBoxes();

    return {
      type: "moov",
      header,
      mvhd: childBoxes.mvhd![0] as MvhdBox,
      trak: childBoxes.trak as TrakBox[],
    };
  }
}

class MvhdBoxParser extends FullBoxParser<MvhdBox> {
  async parseBox(
    header: BoxHeader,
    fullBoxHeader: FullBoxHeader
  ): Promise<MvhdBox> {
    if (fullBoxHeader.version === 1) {
      throw new Error("Version 1 not supported");
    }

    const creationTime = await this.stream.getNextUint32();
    const modificationTime = await this.stream.getNextUint32();
    const timescale = await this.stream.getNextUint32();
    const duration = await this.stream.getNextUint32();
    const rate = await this.stream.getNextUint32();
    const volume = await this.stream.getNextUint16();

    // Reserved.
    await this.stream.getNextUint16();
    await this.stream.getNextUint32();
    await this.stream.getNextUint32();

    const matrix = [];
    for (let i = 0; i < 9; i++) {
      matrix.push(await this.stream.getNextUint32());
    }

    // Predefined.
    for (let i = 0; i < 6; i++) {
      await this.stream.getNextUint32();
    }

    const nextTrackId = await this.stream.getNextUint32();

    return {
      header,
      type: "mvhd",
      fullBoxHeader,
      creationTime,
      modificationTime,
      timescale,
      duration,
      rate,
      volume,
      matrix,
      nextTrackId,
    };
  }
}

class TrakBoxParser extends SimpleBoxParser<TrakBox> {
  async parseBox(header: BoxHeader): Promise<TrakBox> {
    const childBoxes = await this.getChildBoxes();

    return {
      header,
      type: "trak",
      tkhd: childBoxes.tkhd![0] as TkhdBox,
      mdia: childBoxes.mdia![0] as MdiaBox,
    };
  }
}

class TkhdBoxParser extends FullBoxParser<TkhdBox> {
  async parseBox(
    header: BoxHeader,
    fullBoxHeader: FullBoxHeader
  ): Promise<TkhdBox> {
    if (fullBoxHeader.version === 1) {
      throw new Error("Version 1 not supported");
    }

    const creationTime = await this.stream.getNextUint32();
    const modificationTime = await this.stream.getNextUint32();
    const trackId = await this.stream.getNextUint32();
    await this.stream.getNextUint32(); // Reserved
    const duration = await this.stream.getNextUint32();

    await this.stream.getNextUint32(); // Reserved
    await this.stream.getNextUint32(); // Reserved

    const layer = await this.stream.getNextUint16();
    const alternateGroup = await this.stream.getNextUint16();
    const volume = await this.stream.getNextUint16();

    await this.stream.getNextUint16(); // Reserved.

    const matrix = [];
    for (let i = 0; i < 9; i++) {
      matrix.push(await this.stream.getNextUint32());
    }

    const width = (await this.stream.getNextUint32()) >> 16;
    const height = (await this.stream.getNextUint32()) >> 16;

    return {
      header,
      type: "tkhd",
      fullBoxHeader,
      creationTime,
      modificationTime,
      trackId,
      duration,
      layer,
      alternateGroup,
      volume,
      matrix,
      width,
      height,
    };
  }
}

class MdiaBoxParser extends SimpleBoxParser<MdiaBox> {
  async parseBox(header: BoxHeader): Promise<MdiaBox> {
    const childBoxes = await this.getChildBoxes();

    return {
      header,
      type: "mdia",
      mdhd: childBoxes.mdhd![0] as MdhdBox,
      minf: childBoxes.minf![0] as MinfBox,
      hdlr: childBoxes.hdlr![0] as HdlrBox,
    };
  }
}

class MdhdBoxParser extends FullBoxParser<MdhdBox> {
  async parseBox(
    header: BoxHeader,
    fullBoxHeader: FullBoxHeader
  ): Promise<MdhdBox> {
    if (fullBoxHeader.version === 1) {
      throw new Error("Version 1 not supported");
    }

    const creationTime = await this.stream.getNextUint32();
    const modificationTime = await this.stream.getNextUint32();
    const timescale = await this.stream.getNextUint32();
    const duration = await this.stream.getNextUint32();

    const languageBytes = await this.stream.getNextUint16();
    let language = "";
    for (let i = 0; i < 3; i++) {
      language += String.fromCharCode(0x60 + ((languageBytes >> (2 - i) * 5) & 0x1f));
    }

    await this.stream.getNextUint16(); // Reserved.

    return {
      header,
      type: "mdhd",
      fullBoxHeader,
      creationTime,
      modificationTime,
      timescale,
      duration,
      language,
    };
  }
}

class MinfBoxParser extends SimpleBoxParser<MinfBox> {
  async parseBox(header: BoxHeader): Promise<MinfBox> {
    const childBoxes = await this.getChildBoxes();

    return {
      header,
      type: "minf",
      vmhd: "vmhd" in childBoxes ? (childBoxes.vmhd![0] as VmhdBox) : undefined,
      stbl: childBoxes.stbl![0] as StblBox,
      dinf: childBoxes.dinf![0] as DinfBox,
    };
  }
}

class StblBoxParser extends SimpleBoxParser<StblBox> {
  async parseBox(header: BoxHeader): Promise<StblBox> {
    const childBoxes = await this.getChildBoxes();

    return {
      header,
      type: "stbl",
      stco: childBoxes.stco?.[0] as StcoBox,
      co64: childBoxes.co64?.[0] as Co64Box,
      stsc: childBoxes.stsc![0] as StscBox,
      stsd: childBoxes.stsd![0] as StsdBox,
      stss: childBoxes.stss![0] as StssBox,
      stsz: childBoxes.stsz![0] as StszBox,
      stts: childBoxes.stts![0] as SttsBox,
      ctts: childBoxes.ctts ? childBoxes.ctts![0] as CttsBox : undefined,
    };
  }
}

class StsdBoxParser extends FullBoxParser<StsdBox> {
  async parseBox(
    header: BoxHeader,
    fullBoxHeader: FullBoxHeader
  ): Promise<StsdBox> {
    const entryCount = await this.stream.getNextUint32();

    const entries = [];
    for (let i = 0; i < entryCount; i++) {
      const nextChild = (await this.getNextChildBox()) as SampleEntryBox;
      entries.push(nextChild);
    }

    return {
      header,
      type: "stsd",
      fullBoxHeader,
      entries,
    };
  }
}

class Avc1BoxParser extends SimpleBoxParser<Avc1Box> {
  async parseBox(header: BoxHeader): Promise<Avc1Box> {
    // Reserved
    for (let i = 0; i < 6; i++) {
      await this.stream.getNextUint8();
    }

    const dataReferenceIndex = await this.stream.getNextUint16();

    // Technically from VisualSampleEntry but...
    for (let i = 0; i < 2; i++) {
      await this.stream.getNextUint16(); // Reserved
    }
    for (let i = 0; i < 3; i++) {
      await this.stream.getNextUint32(); // Reserved
    }

    const width = await this.stream.getNextUint16();
    const height = await this.stream.getNextUint16();
    const horizontalResolution = await this.stream.getNextUint32();
    const verticalResolution = await this.stream.getNextUint32();

    await this.stream.getNextUint32(); // Reserved

    const frameCount = await this.stream.getNextUint16();
    const compressorName = await this.stream.getNextString(32);
    const depth = await this.stream.getNextUint16();

    await this.stream.getNextUint16(); // Reserved

    const avcC = (await this.getNextChildBox()) as AvcCBox;

    return {
      header,
      type: "avc1",
      avcC,
      compressorName,
      dataReferenceIndex,
      depth,
      frameCount,
      height,
      horizontalResolution,
      verticalResolution,
      width,
    };
  }
}

class AvcCBoxParser extends SimpleBoxParser<AvcCBox> {
  async parseBox(header: BoxHeader): Promise<AvcCBox> {
    const configurationVersion = await this.stream.getNextUint8();
    const profileIndication = await this.stream.getNextUint8();
    const profileCompatibility = await this.stream.getNextUint8();
    const levelIndication = await this.stream.getNextUint8();
    const lengthSizeMinusOne = (await this.stream.getNextUint8()) & 0x3;

    const spsCount = (await this.stream.getNextUint8()) & 0x1f;
    const sps = [];
    for (let i = 0; i < spsCount; i++) {
      const spsLength = await this.stream.getNextUint16();
      const spsData = await this.stream.getNextBytes(spsLength);
      sps.push(spsData);
    }

    const ppsCount = await this.stream.getNextUint8();
    const pps = [];
    for (let i = 0; i < ppsCount; i++) {
      const ppsLength = await this.stream.getNextUint16();
      const ppsData = await this.stream.getNextBytes(ppsLength);
      pps.push(ppsData);
    }

    return {
      header,
      type: "avcC",
      configurationVersion,
      profileIndication,
      profileCompatibility,
      levelIndication,
      lengthSizeMinusOne,
      sequenceParameterSets: sps,
      pictureParameterSets: pps,
    };
  }
}

class StssBoxParser extends FullBoxParser<StssBox> {
  async parseBox(
    header: BoxHeader,
    fullBoxHeader: FullBoxHeader
  ): Promise<StssBox> {
    const entryCount = await this.stream.getNextUint32();
    const sampleNumbers = [];
    for (let i = 0; i < entryCount; i++) {
      sampleNumbers.push(await this.stream.getNextUint32());
    }

    return {
      header,
      type: "stss",
      fullBoxHeader,
      sampleNumbers,
    };
  }
}

class StcoBoxParser extends FullBoxParser<StcoBox> {
  async parseBox(
    header: BoxHeader,
    fullBoxHeader: FullBoxHeader
  ): Promise<StcoBox> {
    const entryCount = await this.stream.getNextUint32();
    const chunkOffsets = [];
    for (let i = 0; i < entryCount; i++) {
      chunkOffsets.push(await this.stream.getNextUint32());
    }

    return {
      header,
      type: "stco",
      fullBoxHeader,
      chunkOffsets,
    };
  }
}

class Co64BoxParser extends FullBoxParser<Co64Box> {
  async parseBox(
    header: BoxHeader,
    fullBoxHeader: FullBoxHeader
  ): Promise<Co64Box> {
    const entryCount = await this.stream.getNextUint32();
    const chunkOffsets = [];
    for (let i = 0; i < entryCount; i++) {
      chunkOffsets.push(Number(await this.stream.getNextUint64()));
    }

    return {
      header,
      type: "co64",
      fullBoxHeader,
      chunkOffsets,
    };
  }
}

class StscBoxParser extends FullBoxParser<StscBox> {
  async parseBox(
    header: BoxHeader,
    fullBoxHeader: FullBoxHeader
  ): Promise<StscBox> {
    const entryCount = await this.stream.getNextUint32();
    const entries = [];
    for (let i = 0; i < entryCount; i++) {
      entries.push({
        firstChunk: await this.stream.getNextUint32(),
        samplesPerChunk: await this.stream.getNextUint32(),
        sampleDescriptionIndex: await this.stream.getNextUint32(),
      });
    }

    return {
      header,
      type: "stsc",
      fullBoxHeader,
      entries,
    };
  }
}

class StszBoxParser extends FullBoxParser<StszBox> {
  async parseBox(
    header: BoxHeader,
    fullBoxHeader: FullBoxHeader
  ): Promise<StszBox> {
    let sampleSizes = [await this.stream.getNextUint32()];
    const sampleCount = await this.stream.getNextUint32();

    // If sample size is 0, then we have a table of sample sizes, otherwise
    // all samples are the same size.
    if (sampleSizes[0] === 0) {
      sampleSizes = [];
      for (let i = 0; i < sampleCount; i++) {
        sampleSizes.push(await this.stream.getNextUint32());
      }
    }

    return {
      header,
      type: "stsz",
      fullBoxHeader,
      sampleSizes,
      sampleCount,
    };
  }
}

class SttsBoxParser extends FullBoxParser<SttsBox> {
  async parseBox(
    header: BoxHeader,
    fullBoxHeader: FullBoxHeader
  ): Promise<SttsBox> {
    const entryCount = await this.stream.getNextUint32();
    const entries = [];
    for (let i = 0; i < entryCount; i++) {
      entries.push({
        sampleCount: await this.stream.getNextUint32(),
        sampleDelta: await this.stream.getNextUint32(),
      });
    }

    return {
      header,
      type: "stts",
      fullBoxHeader,
      entries,
    };
  }
}

class UdtaBoxParser extends SimpleBoxParser<UdtaBox> {
  async parseBox(header: BoxHeader): Promise<UdtaBox> {
    // TODO: Not fully parsed.
    await this.getChildBoxes();

    return {
      header,
      type: "udta",
    };
  }
}

class HdrlBoxParser extends FullBoxParser<HdlrBox> {
  async parseBox(
    header: BoxHeader,
    fullBoxHeader: FullBoxHeader
  ): Promise<HdlrBox> {
    await this.stream.getNextUint32(); // Predefined

    const handlerType = await this.stream.getNextString(4);

    for (let i = 0; i < 3; i++) {
      await this.stream.getNextUint32(); // Reserved
    }

    const name = await this.stream.getNextString();

    return {
      header,
      fullBoxHeader,
      type: "hdlr",
      handlerType,
      name,
    };
  }
}

class VmhdBoxParser extends FullBoxParser<VmhdBox> {
  async parseBox(
    header: BoxHeader,
    fullBoxHeader: FullBoxHeader
  ): Promise<VmhdBox> {
    const graphicsMode = await this.stream.getNextUint16();
    const opColor = [
      await this.stream.getNextUint16(),
      await this.stream.getNextUint16(),
      await this.stream.getNextUint16(),
    ];

    return {
      header,
      fullBoxHeader,
      type: "vmhd",
      graphicsMode,
      opColor,
    };
  }
}

class CttsBoxParser extends FullBoxParser<CttsBox> {
  async parseBox(
    header: BoxHeader,
    fullBoxHeader: FullBoxHeader
  ): Promise<CttsBox> {
    const sampleCount = await this.stream.getNextUint32();
    const sampleCounts = [];
    const sampleOffsets = [];

    for (let i = 0; i < sampleCount; i++) {
      sampleCounts.push(await this.stream.getNextUint32());
      sampleOffsets.push(await this.stream.getNextUint32());
    }

    return {
      header,
      fullBoxHeader,
      type: "ctts",
      sampleCounts,
      sampleOffsets,
    };
  }
}

class DrefBoxParser extends FullBoxParser<DrefBox> {
  async parseBox(
    header: BoxHeader,
    fullBoxHeader: FullBoxHeader
  ): Promise<DrefBox> {
    const entryCount = await this.stream.getNextUint32();
    const entries = [];
    for (let i = 0; i < entryCount; i++) {
      entries.push((await this.getNextChildBox()) as UrlBox | UrnBox);
    }

    return {
      header,
      fullBoxHeader,
      type: "dref",
      entries,
    };
  }
}

class DinfBoxParser extends SimpleBoxParser<DinfBox> {
  async parseBox(header: BoxHeader): Promise<DinfBox> {
    const childBoxes = await this.getChildBoxes();

    return {
      header,
      type: "dinf",
      dref: childBoxes.dref![0] as DrefBox,
    };
  }
}

class UrnBoxParser extends FullBoxParser<UrnBox> {
  async parseBox(
    header: BoxHeader,
    fullBoxHeader: FullBoxHeader
  ): Promise<UrnBox> {
    let name: string = "";
    let location: string = "";
    if (fullBoxHeader.flags !== 1) {
      name = await this.stream.getNextString();
      location = await this.stream.getNextString();
    }

    return {
      header,
      fullBoxHeader,
      type: "urn ",
      name,
      location,
    };
  }
}

class UrlBoxParser extends FullBoxParser<UrlBox> {
  async parseBox(
    header: BoxHeader,
    fullBoxHeader: FullBoxHeader
  ): Promise<UrlBox> {
    let location: string = "";
    if (fullBoxHeader.flags !== 1) {
      location = await this.stream.getNextString();
    }

    return {
      header,
      fullBoxHeader,
      type: "url ",
      location,
    };
  }
}

class UnknownBoxParser extends SimpleBoxParser<UnknownBox> {
  async parseBox(header: BoxHeader): Promise<UnknownBox> {
    this.stream.seek(this.header.endOffset);

    return {
      header,
      type: "unknown",
    };
  }
}

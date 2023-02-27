import { FileStreamWriter } from "./io/writer";
import {
  Avc1Box,
  AvcCBox,
  BaseBox,
  BaseFullBox,
  Box,
  DinfBox,
  DrefBox,
  FtypBox,
  HdlrBox,
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
  UrnBox,
  VmhdBox,
} from "./types";

export async function writeBox(
  stream: FileStreamWriter,
  box: Box
): Promise<void> {
  const boxWriters: Record<
    string,
    new (writer: FileStreamWriter) => BoxWriter<Box>
  > = {
    "url ": UrlBoxWriter,
    "urn ": UrnBoxWriter,
    avc1: Avc1BoxWriter,
    avcC: AvcCBoxWriter,
    dinf: DinfBoxWriter,
    dref: DrefBoxWriter,
    ftyp: FtypBoxWriter,
    hdlr: HdlrBoxWriter,
    mdhd: MdhdBoxWriter,
    mdia: MdiaBoxWriter,
    minf: MinfBoxWriter,
    moov: MoovBoxWriter,
    mvhd: MvhdBoxWriter,
    stbl: StblBoxWriter,
    stco: StcoBoxWriter,
    stsc: StscBoxWriter,
    stsd: StsdBoxWriter,
    stss: StssBoxWriter,
    stsz: StszBoxWriter,
    stts: SttsBoxWriter,
    tkhd: TkhdBoxWriter,
    trak: TrakBoxWriter,
    vmhd: VmhdBoxWriter,
  };

  let writer = boxWriters[box.type];
  if (!writer) {
    console.warn(
      `No writer available for %c${box.type}, not writing.`,
      "text-decoration: underline"
    );
  }

  await new writer(stream).write(box);
}

abstract class BoxWriter<T extends BaseBox> {
  constructor(protected readonly stream: FileStreamWriter) {}

  async write(box: T): Promise<void> {
    const startOffset = this.stream.offset;
    await this.stream.writeNextUint32(0);
    await this.stream.writeNextString(box.type, 4);

    await this.writeContents(box);

    const endOffset = this.stream.offset;
    const size = endOffset - startOffset;
    await this.stream.seek(startOffset);
    await this.stream.writeNextUint32(size);

    await this.stream.seek(endOffset);
  }

  abstract writeContents(box: T): Promise<void>;
}

abstract class FullBoxWriter<T extends BaseFullBox> extends BoxWriter<T> {
  async writeContents(box: T): Promise<void> {
    await this.stream.writeNextUint8(box.fullBoxHeader!.version);

    await this.stream.writeNextUint8(box.fullBoxHeader!.flags >> 16);
    await this.stream.writeNextUint8(box.fullBoxHeader!.flags >> 8);
    await this.stream.writeNextUint8(box.fullBoxHeader!.flags);
  }
}

export class FtypBoxWriter extends BoxWriter<FtypBox> {
  async writeContents(box: FtypBox): Promise<void> {
    await this.stream.writeNextString(box.majorBrand, 4);
    await this.stream.writeNextUint32(box.minorVersion);

    for (const compatibleBrand of box.compatibleBrands) {
      await this.stream.writeNextString(compatibleBrand, 4);
    }
  }
}

export class AvcCBoxWriter extends BoxWriter<AvcCBox> {
  async writeContents(box: AvcCBox): Promise<void> {
    await this.stream.writeNextUint8(box.configurationVersion);

    await this.stream.writeNextUint8(box.profileIndication);
    await this.stream.writeNextUint8(box.profileCompatibility);
    await this.stream.writeNextUint8(box.levelIndication);
    await this.stream.writeNextUint8(box.lengthSizeMinusOne | 0xfc);

    await this.stream.writeNextUint8(box.sequenceParameterSets.length | 0xe0);
    for (const sequenceParameterSet of box.sequenceParameterSets) {
      await this.stream.writeNextUint16(sequenceParameterSet.byteLength);
      await this.stream.writeNextBytes(sequenceParameterSet);
    }

    await this.stream.writeNextUint8(box.pictureParameterSets.length);
    for (const pictureParameterSets of box.pictureParameterSets) {
      await this.stream.writeNextUint16(pictureParameterSets.byteLength);
      await this.stream.writeNextBytes(pictureParameterSets);
    }
  }
}

export class Avc1BoxWriter extends BoxWriter<Avc1Box> {
  // TODO: Generalise as a SampleEntryBoxWriter

  async writeContents(box: Avc1Box): Promise<void> {
    // From SampleEntry
    await this.stream.skip(6);
    await this.stream.writeNextUint16(box.dataReferenceIndex);

    // From VisualSampleEntry
    await this.stream.skip(2 * 2 + 4 * 3);

    await this.stream.writeNextUint16(box.width);
    await this.stream.writeNextUint16(box.height);

    await this.stream.writeNextUint32(box.horizontalResolution);
    await this.stream.writeNextUint32(box.verticalResolution);

    await this.stream.skip(4);

    await this.stream.writeNextUint16(box.frameCount);
    await this.stream.writeNextString(box.compressorName, 32);
    await this.stream.writeNextUint16(box.depth);

    await this.stream.writeNextUint16(0xffff);

    // From AVCSampleEntry
    await writeBox(this.stream, box.avcC);
  }
}

export class StsdBoxWriter extends FullBoxWriter<StsdBox> {
  async writeContents(box: StsdBox): Promise<void> {
    await super.writeContents(box);

    await this.stream.writeNextUint32(box.entries.length);
    for (const entry of box.entries) {
      await writeBox(this.stream, entry);
    }
  }
}

export class StblBoxWriter extends BoxWriter<StblBox> {
  async writeContents(box: StblBox): Promise<void> {
    if (box.stco && box.co64) {
      throw new Error("stbl box cannot contain both stco and co64");
    }

    if (box.stco) {
      await writeBox(this.stream, box.stco);
    } else if (box.co64) {
      await writeBox(this.stream, box.co64);
    }

    await writeBox(this.stream, box.stsc);
    await writeBox(this.stream, box.stsd);
    await writeBox(this.stream, box.stss);
    await writeBox(this.stream, box.stsz);
    await writeBox(this.stream, box.stts);
  }
}

export class UrlBoxWriter extends FullBoxWriter<UrlBox> {
  async writeContents(box: UrlBox): Promise<void> {
    await super.writeContents(box);

    if (box.fullBoxHeader!.flags !== 1) {
      await this.stream.writeNextString(box.location);
    }
  }
}

export class UrnBoxWriter extends FullBoxWriter<UrnBox> {
  async writeContents(box: UrnBox): Promise<void> {
    await super.writeContents(box);

    if (box.fullBoxHeader!.flags !== 1) {
      await this.stream.writeNextString(box.name);
      await this.stream.writeNextString(box.location);
    }
  }
}

export class DinfBoxWriter extends BoxWriter<DinfBox> {
  async writeContents(box: DinfBox): Promise<void> {
    await writeBox(this.stream, box.dref);
  }
}

export class DrefBoxWriter extends FullBoxWriter<DrefBox> {
  async writeContents(box: DrefBox): Promise<void> {
    await super.writeContents(box);

    await this.stream.writeNextUint32(box.entries.length);
    for (const entry of box.entries) {
      await writeBox(this.stream, entry);
    }
  }
}

export class VmhdBoxWriter extends FullBoxWriter<VmhdBox> {
  async writeContents(box: VmhdBox): Promise<void> {
    await super.writeContents(box);

    await this.stream.writeNextUint16(box.graphicsMode);
    for (const color of box.opColor) {
      await this.stream.writeNextUint16(color);
    }
  }
}

export class HdlrBoxWriter extends FullBoxWriter<HdlrBox> {
  async writeContents(box: HdlrBox): Promise<void> {
    await super.writeContents(box);

    await this.stream.skip(4);
    await this.stream.writeNextString(box.handlerType, 4);
    await this.stream.skip(4 * 3);
    await this.stream.writeNextString(box.name);
  }
}

export class StcoBoxWriter extends FullBoxWriter<StcoBox> {
  async writeContents(box: StcoBox): Promise<void> {
    await super.writeContents(box);

    await this.stream.writeNextUint32(box.chunkOffsets.length);
    for (const chunkOffset of box.chunkOffsets) {
      await this.stream.writeNextUint32(chunkOffset);
    }
  }
}

export class StszBoxWriter extends FullBoxWriter<StszBox> {
  async writeContents(box: StszBox): Promise<void> {
    await super.writeContents(box);

    await this.stream.writeNextUint32(
      box.sampleSizes.length > 1 ? 0 : box.sampleSizes[0]
    );
    await this.stream.writeNextUint32(box.sampleCount);
    for (const sampleSize of box.sampleSizes) {
      await this.stream.writeNextUint32(sampleSize);
    }
  }
}

export class StscBoxWriter extends FullBoxWriter<StscBox> {
  async writeContents(box: StscBox): Promise<void> {
    await super.writeContents(box);

    await this.stream.writeNextUint32(box.entries.length);
    for (const entry of box.entries) {
      await this.stream.writeNextUint32(entry.firstChunk);
      await this.stream.writeNextUint32(entry.samplesPerChunk);
      await this.stream.writeNextUint32(entry.sampleDescriptionIndex);
    }
  }
}

export class SttsBoxWriter extends FullBoxWriter<SttsBox> {
  async writeContents(box: SttsBox): Promise<void> {
    await super.writeContents(box);

    await this.stream.writeNextUint32(box.entries.length);
    for (const entry of box.entries) {
      await this.stream.writeNextUint32(entry.sampleCount);
      await this.stream.writeNextUint32(entry.sampleDelta);
    }
  }
}

export class StssBoxWriter extends FullBoxWriter<StssBox> {
  async writeContents(box: StssBox): Promise<void> {
    await super.writeContents(box);

    await this.stream.writeNextUint32(box.sampleNumbers.length);
    for (const sampleNumber of box.sampleNumbers) {
      await this.stream.writeNextUint32(sampleNumber);
    }
  }
}

export class MdhdBoxWriter extends FullBoxWriter<MdhdBox> {
  async writeContents(box: MdhdBox): Promise<void> {
    await super.writeContents(box);

    await this.stream.writeNextUint32(box.creationTime);
    await this.stream.writeNextUint32(box.modificationTime);
    await this.stream.writeNextUint32(box.timescale);
    await this.stream.writeNextUint32(box.duration);

    await this.stream.writeNextUint16(0x55c4); // ISO-639-2/T code for "undetermined"
    await this.stream.skip(2);
  }
}

export class TkhdBoxWriter extends FullBoxWriter<TkhdBox> {
  async writeContents(box: TkhdBox): Promise<void> {
    await super.writeContents(box);

    await this.stream.writeNextUint32(box.creationTime);
    await this.stream.writeNextUint32(box.modificationTime);
    await this.stream.writeNextUint32(box.trackId);

    await this.stream.skip(4);

    await this.stream.writeNextUint32(box.duration);

    await this.stream.skip(4 * 2);

    await this.stream.writeNextUint16(box.layer);
    await this.stream.writeNextUint16(box.alternateGroup);
    await this.stream.writeNextUint16(box.volume);

    await this.stream.skip(2);

    for (const matrix of box.matrix) {
      await this.stream.writeNextUint32(matrix);
    }

    await this.stream.writeNextUint32(box.width);
    await this.stream.writeNextUint32(box.height);
  }
}

export class MvhdBoxWriter extends FullBoxWriter<MvhdBox> {
  async writeContents(box: MvhdBox): Promise<void> {
    await super.writeContents(box);

    await this.stream.writeNextUint32(box.creationTime);
    await this.stream.writeNextUint32(box.modificationTime);
    await this.stream.writeNextUint32(box.timescale);
    await this.stream.writeNextUint32(box.duration);

    await this.stream.writeNextUint32(box.rate);
    await this.stream.writeNextUint16(box.volume);

    await this.stream.skip(2 + 4 * 2);

    for (const matrix of box.matrix) {
      await this.stream.writeNextUint32(matrix);
    }

    await this.stream.skip(4 * 6);

    await this.stream.writeNextUint32(box.nextTrackId);
  }
}

export class MinfBoxWriter extends BoxWriter<MinfBox> {
  async writeContents(box: MinfBox): Promise<void> {
    await writeBox(this.stream, box.vmhd!);
    await writeBox(this.stream, box.dinf!);
    await writeBox(this.stream, box.stbl!);
  }
}

export class MdiaBoxWriter extends BoxWriter<MdiaBox> {
  async writeContents(box: MdiaBox): Promise<void> {
    await writeBox(this.stream, box.mdhd!);
    await writeBox(this.stream, box.hdlr!);
    await writeBox(this.stream, box.minf!);
  }
}

export class TrakBoxWriter extends BoxWriter<TrakBox> {
  async writeContents(box: TrakBox): Promise<void> {
    await writeBox(this.stream, box.tkhd!);
    await writeBox(this.stream, box.mdia!);
  }
}

export class MoovBoxWriter extends BoxWriter<MoovBox> {
  async writeContents(box: MoovBox): Promise<void> {
    await writeBox(this.stream, box.mvhd!);
    for (const trak of box.trak) {
      await writeBox(this.stream, trak);
    }
  }
}

export class MdatBoxStreamWriter {
  private startOffset: number = 0;
  private sizeOffset: number = 0;

  private opened = false;
  private closed = false;

  constructor(private readonly stream: FileStreamWriter) {}

  async open() {
    if (this.opened) {
      throw new Error("already opened");
    } else if (this.closed) {
      throw new Error("already closed");
    }

    this.startOffset = this.stream.offset;
    await this.stream.writeNextUint32(1);
    await this.stream.writeNextString("mdat", 4);

    this.sizeOffset = this.stream.offset;
    await this.stream.writeNextUint64(0);

    this.opened = true;
  }

  async write(bytes: Blob | BufferSource): Promise<void> {
    if (!this.opened) {
      throw new Error("not opened");
    } else if (this.closed) {
      throw new Error("already closed");
    }

    await this.stream.writeNextBytes(bytes);
  }

  async close() {
    if (!this.opened) {
      throw new Error("not opened");
    } else if (this.closed) {
      throw new Error("already closed");
    }

    const endOffset = this.stream.offset;

    await this.stream.seek(this.sizeOffset);
    await this.stream.writeNextUint64(endOffset - this.startOffset);
    await this.stream.seek(endOffset);

    this.closed = true;
  }

  get dataStartOffset(): number {
    if (!this.opened) {
      throw new Error("not opened");
    }

    return this.startOffset + 16;
  }
}

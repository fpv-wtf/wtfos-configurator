export type ContainerBoxType =
  | "moov"
  | "trak"
  | "mdia"
  | "minf"
  | "stbl"
  | "udta"
  | "dinf"
  | UnknownBoxType;

export type SampleEntryBoxType = "avc1" | UnknownBoxType;

export type UnknownBoxType = "unknown";

export type BoxType =
  | ContainerBoxType
  | SampleEntryBoxType
  | "avcC"
  | "co64"
  | "dref"
  | "ftyp"
  | "hdlr"
  | "mdat"
  | "mdhd"
  | "mvhd"
  | "stco"
  | "stsc"
  | "stsd"
  | "stss"
  | "stsz"
  | "stts"
  | "tkhd"
  | "url "
  | "urn "
  | "vmhd"
  | "ctts"
  | UnknownBoxType;

export type ContainerBox =
  | MoovBox
  | TrakBox
  | MdiaBox
  | MinfBox
  | StblBox
  | UnknownBox;

export type SampleEntryBox = Avc1Box | UnknownBox;

export type Box =
  | ContainerBox
  | SampleEntryBox
  | AvcCBox
  | Co64Box
  | DinfBox
  | DrefBox
  | FtypBox
  | HdlrBox
  | MdatBox
  | MdhdBox
  | MvhdBox
  | StcoBox
  | StscBox
  | StsdBox
  | StssBox
  | StszBox
  | SttsBox
  | TkhdBox
  | UdtaBox
  | UrlBox
  | UrnBox
  | VmhdBox
  | CttsBox
  | UnknownBox;

export interface BoxHeader {
  size: number;
  type: string;

  startOffset: number;
  endOffset: number;
}

export interface FullBoxHeader {
  version: number;
  flags: number;
}

export interface BaseBox<T extends BoxType = BoxType> {
  header?: BoxHeader;
  type: T;
}

export interface BaseFullBox<T extends BoxType = BoxType> extends BaseBox<T> {
  fullBoxHeader?: FullBoxHeader;
}

// Containers
export interface MdatBox extends BaseBox<"mdat"> {}
export interface MoovBox extends BaseBox<"moov"> {
  mvhd: MvhdBox;
  trak: TrakBox[];
}

export interface TrakBox extends BaseBox<"trak"> {
  tkhd: TkhdBox;
  mdia: MdiaBox;
}

export interface MdiaBox extends BaseBox<"mdia"> {
  hdlr: HdlrBox;
  mdhd: MdhdBox;
  minf: MinfBox;
}

export interface MinfBox extends BaseBox<"minf"> {
  stbl: StblBox;
  dinf: DinfBox;
  vmhd?: VmhdBox;
}

export interface StblBox extends BaseBox<"stbl"> {
  stco?: StcoBox;
  co64?: Co64Box;
  stsc: StscBox;
  stsd: StsdBox;
  stss: StssBox;
  stsz: StszBox;
  stts: SttsBox;
  ctts?: CttsBox;
}

export interface UdtaBox extends BaseBox<"udta"> {}

export interface DinfBox extends BaseBox<"dinf"> {
  dref: DrefBox;
}

export interface FtypBox extends BaseBox<"ftyp"> {
  majorBrand: string;
  minorVersion: number;
  compatibleBrands: string[];
}

export interface MvhdBox extends BaseFullBox<"mvhd"> {
  creationTime: number;
  duration: number;
  matrix: number[];
  modificationTime: number;
  nextTrackId: number;
  rate: number;
  timescale: number;
  volume: number;
}

export interface TkhdBox extends BaseFullBox<"tkhd"> {
  alternateGroup: number;
  creationTime: number;
  duration: number;
  height: number;
  layer: number;
  matrix: number[];
  modificationTime: number;
  trackId: number;
  volume: number;
  width: number;
}

export interface MdhdBox extends BaseFullBox<"mdhd"> {
  creationTime: number;
  duration: number;
  language: string;
  modificationTime: number;
  timescale: number;
}

export interface BaseSampleEntryBox<
  T extends SampleEntryBoxType = SampleEntryBoxType
> extends BaseBox<T> {
  dataReferenceIndex: number;
  width: number;
  height: number;
  horizontalResolution: number;
  verticalResolution: number;
  frameCount: number;
  compressorName: string;
  depth: number;
}

export interface Avc1Box extends BaseSampleEntryBox<"avc1"> {
  avcC: AvcCBox;
}

export interface AvcCBox extends BaseBox<"avcC"> {
  // Technically these are inside a struct in the box, but it's the only
  // thing actually in the box.
  configurationVersion: number;
  profileIndication: number;
  profileCompatibility: number;
  levelIndication: number;
  lengthSizeMinusOne: number;
  sequenceParameterSets: Uint8Array[];
  pictureParameterSets: Uint8Array[];
}

export interface StsdBox extends BaseFullBox<"stsd"> {
  entries: SampleEntryBox[];
}

/**
 * Sync sample table.
 */
export interface StssBox extends BaseFullBox<"stss"> {
  sampleNumbers: number[];
}

/**
 * Time-to-sample table.
 */
export interface SttsBox extends BaseFullBox<"stts"> {
  entries: {
    sampleCount: number;
    sampleDelta: number;
  }[];
}

/**
 * Sample to chunk table.
 */
export interface StscBox extends BaseFullBox<"stsc"> {
  entries: {
    firstChunk: number;
    samplesPerChunk: number;
    sampleDescriptionIndex: number;
  }[];
}

/**
 * Sample size table.
 */
export interface StszBox extends BaseFullBox<"stsz"> {
  sampleSizes: number[];
  sampleCount: number;
}

/**
 * Chunk offset table.
 */
export interface StcoBox extends BaseFullBox<"stco"> {
  chunkOffsets: number[];
}

/**
 * Chunk offset table (64-bit).
 */
export interface Co64Box extends BaseFullBox<"co64"> {
  chunkOffsets: number[];
}

export interface HdlrBox extends BaseFullBox<"hdlr"> {
  handlerType: string;
  name: string;
}

export interface VmhdBox extends BaseFullBox<"vmhd"> {
  graphicsMode: number;
  opColor: number[];
}

export interface CttsBox extends BaseFullBox<"ctts"> {
  sampleCounts: number[];
  sampleOffsets: number[];
}

export interface UrlBox extends BaseFullBox<"url "> {
  location: string;
}

export interface UrnBox extends BaseFullBox<"urn "> {
  name: string;
  location: string;
}

export interface DrefBox extends BaseFullBox<"dref"> {
  entries: (UrlBox | UrnBox)[];
}

export interface UnknownBox extends BaseBox<"unknown"> {}

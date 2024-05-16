import { StreamDataView } from "stream-data-view";

interface OsdHeader {
  magic: string;
  version: number;
  config: OsdConfig;
}

interface OsdConfig {
  charWidth: number;
  charHeight: number;
  fontWidth: number;
  fontHeight: number;
  xOffset: number;
  yOffset: number;
  fontVariant:  string;
}

interface OsdHeaderV1 {
  magic: string;
  version: number;
  config: OsdConfigV1;
}

interface OsdConfigV1 {
  charWidth: number;
  charHeight: number;
  fontWidth: number;
  fontHeight: number;
  xOffset: number;
  yOffset: number;
  fontVariant: number;
}

interface OsdFrame {
  frameNumber: number;
  frameSize: number;
  frameData: Uint16Array;
}

export class OsdReader {
  readonly header: OsdHeader;
  readonly frames: OsdFrame[] = [];

  constructor(data: ArrayBuffer) {
    const stream = new StreamDataView(data);
    this.header = {
      magic: stream.getNextString(7),
      version: stream.getNextUint16(),
      config: {
        charWidth: stream.getNextUint8(),
        charHeight: stream.getNextUint8(),
        fontWidth: stream.getNextUint8(),
        fontHeight: stream.getNextUint8(),
        xOffset: stream.getNextUint16(),
        yOffset: stream.getNextUint16(),
        fontVariant: stream.getNextString(5).substring(0, 4), // read 5 bytes, keep 4. string is from c; null terminated. reading all 5 leaves pointer in right place to start reading frames below
      },
    };

    // v1 of this format used a slightly different structure - fontVariant was a number, not a string
    // in msp-osd itself an enum was used to store the FC variant, which became the number we have here
    // since msp-osd 0.12 we use the FC identifier internally (so we don't need to rely on the magic enum)
    // this maps the legacy enum to the correct string identifier, as well as leaving the file pointer
    // in the correct place for a legacy file
    if (this.header.version === 1) {
      stream.resetOffset();
      const tempheader : OsdHeaderV1  = {
        magic: stream.getNextString(7),
        version: stream.getNextUint16(),
        config: {
          charWidth: stream.getNextUint8(),
          charHeight: stream.getNextUint8(),
          fontWidth: stream.getNextUint8(),
          fontHeight: stream.getNextUint8(),
          xOffset: stream.getNextUint16(),
          yOffset: stream.getNextUint16(),
          fontVariant: stream.getNextUint8(),
        },
      };

      switch (tempheader.config.fontVariant) {
        case 1: // FONT_VARIANT_BETAFLIGHT
          this.header.config.fontVariant = "BTFL";
          break;
        case 2: // FONT_VARIANT_INAV
          this.header.config.fontVariant = "INAV";
          break;
        case 3: // FONT_VARIANT_ARDUPILOT
          this.header.config.fontVariant = "ARDU";
          break;
        case 4: // FONT_VARIANT_KISS_ULTRA
          this.header.config.fontVariant = "ULTR";
          break;
        case 5: // FONT_VARIANT_QUICKSILVER
          this.header.config.fontVariant = "QUIC";
          break;
        default:
          this.header.config.fontVariant = ""; // Empty string for unknown variant
      }
    }

    if (this.header.config.charWidth === 31) {
      this.header.config.charWidth = 30;
    }

    while (stream.getOffset() < data.byteLength) {
      try {
        const frameNumber = stream.getNextUint32();
        const frameSize = stream.getNextUint32();
        const frameData = new Uint16Array(data, stream.getOffset(), frameSize);
        stream.setOffset(stream.getOffset() + frameSize * 2);

        this.frames.push({
          frameNumber,
          frameSize,
          frameData,
        });
      } catch (e) {
        if (e instanceof RangeError) {
          console.warn("No more data in OSD file, probably truncated due to power loss");
          break;
        }
      }
    }
  }

  static async fromFile(file: File): Promise<OsdReader> {
    const data = await file.arrayBuffer();
    return new OsdReader(data);
  }
}

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
        fontVariant: stream.getNextUint8(),
      },
    };

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

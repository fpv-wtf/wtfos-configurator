export class FileStreamWriter {
  private readonly file: FileSystemFileHandle;
  private stream?: FileSystemWritableFileStream;

  private buffer?: ArrayBuffer;

  private uint8Buffer?: Uint8Array;
  private uint16Buffer?: Uint16Array;
  private uint32Buffer?: Uint32Array;
  private uint64Buffer?: BigUint64Array;

  private uint16View?: DataView;
  private uint32View?: DataView;
  private uint64View?: DataView;

  private _offset = 0;
  private _size = 0;

  constructor(file: FileSystemFileHandle) {
    this.file = file;

    this.buffer = new ArrayBuffer(8);

    this.uint8Buffer = new Uint8Array(this.buffer, 0, 1);
    this.uint16Buffer = new Uint16Array(this.buffer, 0, 1);
    this.uint32Buffer = new Uint32Array(this.buffer, 0, 1);
    this.uint64Buffer = new BigUint64Array(this.buffer, 0, 1);

    this.uint16View = new DataView(this.buffer, 0, 2);
    this.uint32View = new DataView(this.buffer, 0, 4);
    this.uint64View = new DataView(this.buffer, 0, 8);
  }

  async writeNextUint8(value: number): Promise<void> {
    this.uint8Buffer![0] = value;

    await this.writeNextBytes(this.uint8Buffer!);
  }

  async writeNextUint16(value: number): Promise<void> {
    this.uint16View!.setUint16(0, value, false);
    await this.writeNextBytes(this.uint16Buffer!);
  }

  async writeNextUint32(value: number): Promise<void> {
    this.uint32View!.setUint32(0, value, false);
    await this.writeNextBytes(this.uint32Buffer!);
  }

  async writeNextUint64(value: number | bigint): Promise<void> {
    if (typeof value === "number") {
      value = BigInt(value);
    }

    this.uint64View!.setBigUint64(0, value, false);
    await this.writeNextBytes(this.uint64Buffer!);
  }

  async writeNextString(value: string, length?: number): Promise<void> {
    const buffer = new Uint8Array(
      length !== undefined ? length : value.length + 1
    );

    const encoder = new TextEncoder();
    encoder.encodeInto(value, buffer);

    await this.writeNextBytes(buffer);
  }

  async writeNextBytes(bytes: BufferSource | Blob): Promise<void> {
    const stream = await this.getStream();
    await stream.write(bytes);

    const byteLength = bytes instanceof Blob ? bytes.size : bytes.byteLength;
    this._offset += byteLength;
    this._size += byteLength;
  }

  async skip(length: number) {
    await this.seek(this.offset + length);
  }

  async seek(offset: number) {
    const stream = await this.getStream();
    await stream.seek(offset);
    this._offset = offset;
  }

  async close() {
    const stream = await this.getStream();
    await stream.close();
    this.stream = undefined;
  }

  private async getStream(): Promise<FileSystemWritableFileStream> {
    if (!this.stream) {
      this.stream = await this.file.createWritable();
      await this.stream.truncate(0);

      this._size = 0;
      this._offset = 0;
    }

    return this.stream;
  }

  get offset(): number {
    return this._offset;
  }

  get size(): number {
    return this._size;
  }
}

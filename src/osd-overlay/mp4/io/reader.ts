export class FileStreamReader {
  private static readonly BUFFER_SIZE = 1024 * 1024 * 8; // 8MB

  private file: File;

  private buffer = new ArrayBuffer(0);
  private bufferOffset = 0;
  private _offset = 0;

  constructor(file: File) {
    this.file = file;
  }

  async getNextString(length?: number): Promise<string> {
    let bytes: Uint8Array;

    if (length) {
      bytes = await this.getNextBytes(length);
    } else {
      const byteBuffer = [];
      let byte: number;
      while ((byte = await this.getNextUint8()) !== 0) {
        byteBuffer.push(byte);
      }

      bytes = new Uint8Array(byteBuffer);
    }

    const decoder = new TextDecoder();
    const string = decoder.decode(bytes);
    return string;
  }

  async getNextUint8(): Promise<number> {
    const view = await this.getDataView(1);
    return view.getUint8(0);
  }

  async getNextUint16(): Promise<number> {
    const view = await this.getDataView(2);
    return view.getUint16(0);
  }

  async getNextUint32(): Promise<number> {
    const view = await this.getDataView(4);
    return view.getUint32(0);
  }

  async getNextUint64(): Promise<bigint> {
    const view = await this.getDataView(8);
    return view.getBigUint64(0);
  }

  async getNextBytes(length: number): Promise<Uint8Array> {
    const view = await this.getDataView(length);
    const result = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      result[i] = view.getUint8(i);
    }

    return result;
  }

  seek(offset: number) {
    this._offset = offset;
    if (
      this._offset < this.bufferOffset ||
      this._offset > this.bufferEndOffset
    ) {
      this.buffer = new ArrayBuffer(0);
      this.bufferOffset = this._offset;
    }
  }

  skip(length: number) {
    this._offset += length;
  }

  get eof() {
    return this.offset >= this.file.size;
  }

  get offset() {
    return this._offset;
  }

  get size() {
    return this.file.size;
  }

  private async fillBuffer(length: number) {
    const fillEndOffset = this.offset + length;

    if (fillEndOffset > this.bufferEndOffset) {
      const newBufferOffset =
        Math.floor(this.offset / FileStreamReader.BUFFER_SIZE) *
        FileStreamReader.BUFFER_SIZE;
      const newBufferEndOffset =
        Math.ceil(fillEndOffset / FileStreamReader.BUFFER_SIZE) *
        FileStreamReader.BUFFER_SIZE;

      this.buffer = await this.file
        .slice(newBufferOffset, newBufferEndOffset)
        .arrayBuffer();
      this.bufferOffset = newBufferOffset;
    }
  }

  private async getDataView(length: number): Promise<DataView> {
    await this.fillBuffer(length);

    const result = new DataView(
      this.buffer,
      this.offset - this.bufferOffset,
      length
    );
    this._offset += length;
    return result;
  }

  private get bufferEndOffset() {
    return this.bufferOffset + this.buffer.byteLength;
  }
}

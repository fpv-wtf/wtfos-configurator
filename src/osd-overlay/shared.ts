import { FontPackFiles } from "./fonts";

namespace VideoWorkerShared {
  export const enum MessageType {
    COMPLETE,
    ERROR,
    PROGRESS_INIT,
    PROGRESS_UPDATE,
    START,
  }

  export interface CompleteMessage {
    type: MessageType.COMPLETE;
  }

  export interface ErrorMessage {
    type: MessageType.ERROR;
    error: Error;
  }

  export interface ProgressInitMessage {
    type: MessageType.PROGRESS_INIT;

    expectedFrames: number;
  }

  export interface ProgressUpdateMessage {
    type: MessageType.PROGRESS_UPDATE;

    framesDecoded?: number;
    framesDecodedMissing?: number;
    framesEncoded?: number;
    inDecoderQueue?: number;
    inEncoderQueue?: number;
    preview?: ImageBitmap;
    queuedForDecode?: number;
    queuedForEncode?: number;
  }

  export interface StartMessage {
    type: MessageType.START;

    chromaKey: boolean;
    chromaKeyColor: string;

    fontFiles: FontPackFiles,
    osdFile: File;
    srtFile: File;
    outHandle: FileSystemFileHandle;
    videoFile: File;
  }

  export type Message =
    | CompleteMessage
    | ErrorMessage
    | ProgressInitMessage
    | ProgressUpdateMessage
    | StartMessage;



  export class DecoderError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "DecoderError";
    }
  }

  export class DecoderConfigureError extends DecoderError {
    constructor(message: string) {
      super(message);
      this.name = "DecoderConfigureError";
    }
  }

  export class EncoderError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "EncoderError";
    }
  }

  export class EncoderConfigureError extends EncoderError {
    constructor(message: string) {
      super(message);
      this.name = "EncoderConfigureError";
    }
  }

}

export default VideoWorkerShared;

import VideoWorkerShared from "./shared";
import { FontPackFiles } from "./fonts";

export interface VideoWorkerManagerCallbacks {
  onComplete?: () => void;
  onError?: (error: Error) => void;
  onProgressInit: (options: {
    expectedFrames: number;

  }) => void;
  onProgressUpdate: (options: {
    framesDecoded?: number;
    framesDecodedMissing?: number;
    framesEncoded?: number;
    inDecoderQueue?: number;
    inEncoderQueue?: number;
    preview?: ImageBitmap;
    queuedForDecode?: number;
    queuedForEncode?: number;
  }) => void;
}

export default class VideoWorkerManager {
  callbacks?: VideoWorkerManagerCallbacks;
  worker: Worker;

  constructor() {
    this.worker = new Worker(
      new URL("./worker", import.meta.url),
      { type: "module" }
    );

    this.worker.addEventListener("message", this.onMessage.bind(this));
  }

  setCallbacks(callbacks: VideoWorkerManagerCallbacks) {
    this.callbacks = callbacks;
  }

  onMessage(event: MessageEvent) {
    const message = event.data as VideoWorkerShared.Message;

    switch (message.type) {
      case VideoWorkerShared.MessageType.COMPLETE: {
        this.callbacks?.onComplete?.();
        break;
      }

      case VideoWorkerShared.MessageType.ERROR: {
        this.callbacks?.onError?.(message.error);
        break;
      }

      case VideoWorkerShared.MessageType.PROGRESS_INIT: {
        this.callbacks?.onProgressInit({
          expectedFrames: message.expectedFrames,
        });
        break;
      }

      case VideoWorkerShared.MessageType.PROGRESS_UPDATE: {
        this.callbacks?.onProgressUpdate({
          framesDecoded: message.framesDecoded,
          framesEncoded: message.framesEncoded,
          framesDecodedMissing: message.framesDecodedMissing,
          inDecoderQueue: message.inDecoderQueue,
          inEncoderQueue: message.inEncoderQueue,
          preview: message.preview,
          queuedForDecode: message.queuedForDecode,
          queuedForEncode: message.queuedForEncode,
        });
        break;
      }

      default: {
        throw new Error("Unknown message type received");
      }
    }
  }

  start(options: {
    chromaKey: boolean
    chromaKeyColor: string
    fontFiles: FontPackFiles,
    osdFile: File,
    outHandle: FileSystemFileHandle
    videoFile: File,
  }) {
    this.postMessage({
      type: VideoWorkerShared.MessageType.START,
      ...options,
    });
  }

  private postMessage(message: VideoWorkerShared.Message) {
    this.worker.postMessage(message);
  }
}

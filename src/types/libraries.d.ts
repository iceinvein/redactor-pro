// Type declarations for external libraries
// Most packages provide their own types, this file is for additional declarations if needed

declare module "pdfjs-dist/build/pdf.worker.min.mjs" {
  const workerSrc: string;
  export default workerSrc;
}

// Tesseract.js type declarations
declare namespace Tesseract {
  interface LoggerMessage {
    status: string;
    progress?: number;
  }

  interface WorkerOptions {
    logger?: (message: LoggerMessage) => void;
    errorHandler?: (error: Error) => void;
    corePath?: string;
    langPath?: string;
    cachePath?: string;
    dataPath?: string;
    workerPath?: string;
    cacheMethod?: string;
    workerBlobURL?: boolean;
    gzip?: boolean;
    legacyLang?: boolean;
    legacyCore?: boolean;
  }

  interface Word {
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }

  interface Page {
    text: string;
    confidence: number;
    words: Word[];
  }

  interface Worker {
    load(): Promise<Worker>;
    loadLanguage(lang: string): Promise<Worker>;
    initialize(lang: string): Promise<Worker>;
    recognize(
      image: ImageData | HTMLCanvasElement | string,
    ): Promise<RecognizeResult>;
    terminate(): Promise<void>;
  }

  interface RecognizeResult {
    data: Page;
  }

  function createWorker(options?: WorkerOptions): Promise<Worker>;
}

// ONNX Runtime type declarations
declare namespace ort {
  interface InferenceSession {
    run(feeds: Record<string, Tensor>): Promise<Record<string, Tensor>>;
    release(): Promise<void>;
  }

  interface Tensor {
    data: Float32Array | Int32Array | Uint8Array;
    dims: number[];
    type: string;
  }

  namespace InferenceSession {
    function create(modelPath: string | ArrayBuffer): Promise<InferenceSession>;
  }

  function Tensor(
    type: string,
    data: Float32Array | Int32Array | Uint8Array,
    dims: number[],
  ): Tensor;
}

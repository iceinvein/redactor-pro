/**
 * Web Worker for OCR processing
 * Runs Tesseract.js in a separate thread to avoid blocking the main UI thread
 */

import type { OCRResult } from "../types/redaction";
import { OCREngineImpl } from "./OCREngine";

// Message types for communication between main thread and worker
interface InitMessage {
  type: "init";
}

interface ExtractTextMessage {
  type: "extractText";
  imageData: ImageData;
  requestId: string;
}

interface TerminateMessage {
  type: "terminate";
}

type WorkerMessage = InitMessage | ExtractTextMessage | TerminateMessage;

interface SuccessResponse {
  type: "success";
  requestId: string;
  result: OCRResult;
}

interface ErrorResponse {
  type: "error";
  requestId: string;
  error: string;
}

interface ProgressResponse {
  type: "progress";
  requestId?: string;
  progress: number;
  status: string;
}

// Response types for type safety
// type WorkerResponse = SuccessResponse | ErrorResponse | ProgressResponse;

// Initialize OCR engine instance
const ocrEngine = new OCREngineImpl();

// Set up progress callback
ocrEngine.setProgressCallback((progress: number, status: string) => {
  const response: ProgressResponse = {
    type: "progress",
    progress,
    status,
  };
  self.postMessage(response);
});

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  try {
    switch (message.type) {
      case "init": {
        await ocrEngine.initialize();
        const response: ProgressResponse = {
          type: "progress",
          progress: 100,
          status: "OCR engine initialized",
        };
        self.postMessage(response);
        break;
      }

      case "extractText": {
        const result = await ocrEngine.extractText(message.imageData);
        const response: SuccessResponse = {
          type: "success",
          requestId: message.requestId,
          result,
        };
        self.postMessage(response);
        break;
      }

      case "terminate": {
        ocrEngine.terminate();
        self.close();
        break;
      }

      default: {
        const errorResponse: ErrorResponse = {
          type: "error",
          requestId: "",
          error: "Unknown message type",
        };
        self.postMessage(errorResponse);
      }
    }
  } catch (error) {
    const errorResponse: ErrorResponse = {
      type: "error",
      requestId:
        "type" in message && "requestId" in message ? message.requestId : "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
    self.postMessage(errorResponse);
  }
};

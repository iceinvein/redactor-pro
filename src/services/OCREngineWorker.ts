import type { OCREngine, OCRResult } from "../types/redaction";

/**
 * Web Worker wrapper for OCR processing
 * Provides a clean API for running OCR in a background thread
 */
export class OCREngineWorker implements OCREngine {
  private worker: Worker | null = null;
  private isInitialized = false;
  private requestCounter = 0;
  private pendingRequests = new Map<
    string,
    {
      resolve: (result: OCRResult) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  >();
  private progressCallback?: (progress: number, status: string) => void;
  private readonly TIMEOUT_MS = 120000; // 120 second timeout for OCR operations

  /**
   * Initialize the OCR worker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        // Create the worker
        this.worker = new Worker(new URL("./ocr.worker.ts", import.meta.url), {
          type: "module",
        });

        // Set up message handler
        this.worker.onmessage = (event) => {
          this.handleWorkerMessage(event.data);
        };

        // Set up error handler
        this.worker.onerror = (error) => {
          console.error("[OCRWorker] Worker error:", error);
          reject(new Error(`OCR Worker error: ${error.message}`));
        };

        // Send initialization message
        this.worker.postMessage({ type: "init" });

        // Wait for initialization to complete
        const initTimeout = setTimeout(() => {
          reject(new Error("OCR worker initialization timeout - language data download may have failed"));
        }, 120000); // 120 second timeout for initialization (language download can be slow)

        const originalCallback = this.progressCallback;
        this.progressCallback = (progress, status) => {
          if (originalCallback) {
            originalCallback(progress, status);
          }
          if (progress === 100 && status === "OCR engine initialized") {
            clearTimeout(initTimeout);
            this.isInitialized = true;
            this.progressCallback = originalCallback;
            resolve();
          }
        };
      } catch (error) {
        console.error("[OCRWorker] Failed to create worker:", error);
        reject(
          new Error(
            `Failed to create OCR worker: ${error instanceof Error ? error.message : "Unknown error"}`,
          ),
        );
      }
    });
  }

  /**
   * Set a callback function to receive progress updates
   */
  setProgressCallback(
    callback: (progress: number, status: string) => void,
  ): void {
    this.progressCallback = callback;
  }

  /**
   * Extract text from an image using the worker
   * Automatically initializes the worker if not already initialized (lazy loading)
   */
  async extractText(imageData: ImageData): Promise<OCRResult> {
    // Lazy initialization: initialize worker on first use
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error("OCR worker failed to initialize");
    }

    return new Promise((resolve, reject) => {
      const requestId = `req_${++this.requestCounter}`;

      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error("OCR operation timeout"));
      }, this.TIMEOUT_MS);

      // Store the request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout,
      });

      // Send the request to the worker
      this.worker!.postMessage({
        type: "extractText",
        imageData,
        requestId,
      });
    });
  }

  /**
   * Terminate the worker and free resources
   */
  terminate(): void {
    if (this.worker) {
      // Clear all pending requests
      for (const [_requestId, request] of this.pendingRequests.entries()) {
        clearTimeout(request.timeout);
        request.reject(new Error("OCR worker terminated"));
      }
      this.pendingRequests.clear();

      // Terminate the worker
      this.worker.postMessage({ type: "terminate" });
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  /**
   * Check if the OCR worker is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Handle messages from the worker
   */
  private handleWorkerMessage(message: {
    type: string;
    requestId?: string;
    result?: OCRResult;
    error?: string;
    progress?: number;
    status?: string;
  }): void {
    switch (message.type) {
      case "success": {
        if (message.requestId && message.result) {
          const request = this.pendingRequests.get(message.requestId);
          if (request) {
            clearTimeout(request.timeout);
            this.pendingRequests.delete(message.requestId);
            request.resolve(message.result);
          }
        }
        break;
      }

      case "error": {
        const requestId = message.requestId;
        if (requestId) {
          const request = this.pendingRequests.get(requestId);
          if (request) {
            clearTimeout(request.timeout);
            this.pendingRequests.delete(requestId);
            request.reject(new Error(message.error || "Unknown OCR error"));
          }
        }
        break;
      }

      case "progress": {
        if (
          this.progressCallback &&
          message.progress !== undefined &&
          message.status
        ) {
          this.progressCallback(message.progress, message.status);
        }
        break;
      }

      default:
        console.warn("Unknown message type from OCR worker:", message.type);
    }
  }
}

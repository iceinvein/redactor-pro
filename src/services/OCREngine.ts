import {
  createWorker,
  PSM,
  type Worker as TesseractWorker,
} from "tesseract.js";
import type { OCREngine, OCRResult, OCRWord } from "../types/redaction";

/**
 * OCREngine service for extracting text from images using Tesseract.js
 * Provides word-level bounding boxes for precise PII detection and redaction
 */
export class OCREngineImpl implements OCREngine {
  private worker: TesseractWorker | null = null;
  private isInitialized = false;
  private progressCallback?: (progress: number, status: string) => void;

  /**
   * Initialize the Tesseract worker with English language
   * This is now called lazily when text extraction is first needed
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.updateProgress(0, "Creating OCR worker...");
      this.updateProgress(
        30,
        "Downloading language data (~4MB, first time only)...",
      );

      this.worker = await createWorker("eng", 1, {
        errorHandler: (err: Error) => {
          console.error("[OCR] Tesseract error:", err);
        },
      });

      this.isInitialized = true;
      this.updateProgress(100, "OCR engine ready");
    } catch (error) {
      console.error("[OCR] Initialization failed:", error);
      this.isInitialized = false;
      throw new Error(
        `Failed to initialize OCR engine: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
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
   * Extract text from an image with word-level bounding boxes
   * Automatically initializes the worker if not already initialized (lazy loading)
   */
  async extractText(imageData: ImageData): Promise<OCRResult> {
    // Lazy initialization: initialize worker on first use
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error("OCR engine failed to initialize");
    }

    try {
      this.updateProgress(0, "Starting text extraction...");

      // Use OffscreenCanvas which is available in workers
      const canvas = new OffscreenCanvas(imageData.width, imageData.height);
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Failed to create OffscreenCanvas context");
      }

      ctx.putImageData(imageData, 0, 0);

      // Perform OCR recognition with word-level data
      await this.worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO_OSD, // Auto page segmentation with OSD
      });

      const result = await this.worker.recognize(
        canvas,
        {},
        {
          text: true,
          blocks: true,
          hocr: false,
          tsv: false,
        },
      );

      if (!result || !result.data) {
        throw new Error("OCR recognition returned invalid result");
      }

      const words: OCRWord[] = [];

      // Extract words from blocks structure (Tesseract v6 format)
      if (result.data.blocks && Array.isArray(result.data.blocks)) {
        for (const block of result.data.blocks) {
          if (block.paragraphs && Array.isArray(block.paragraphs)) {
            for (const paragraph of block.paragraphs) {
              if (paragraph.lines && Array.isArray(paragraph.lines)) {
                for (const line of paragraph.lines) {
                  if (line.words && Array.isArray(line.words)) {
                    // Get line baseline for more accurate bounding boxes
                    const lineBaseline = line.baseline?.y0 || null;

                    for (const word of line.words) {
                      let bbox = {
                        x0: word.bbox.x0,
                        y0: word.bbox.y0,
                        x1: word.bbox.x1,
                        y1: word.bbox.y1,
                      };

                      const width = bbox.x1 - bbox.x0;
                      const height = bbox.y1 - bbox.y0;
                      const avgCharWidth = width / word.text.length;
                      const aspectRatio = height / avgCharWidth;

                      // If bbox is unreasonably tall and we have baseline info, use it to correct
                      if (lineBaseline !== null && aspectRatio > 2.5) {
                        // Typical text height is about 1.2-1.5x character width
                        const expectedHeight = avgCharWidth * 1.5;
                        const correctedY0 = lineBaseline - expectedHeight * 0.8; // 80% above baseline

                        bbox = {
                          x0: bbox.x0,
                          y0: correctedY0,
                          x1: bbox.x1,
                          y1: bbox.y1,
                        };
                      }

                      words.push({
                        text: word.text,
                        bbox,
                        confidence: word.confidence,
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }

      this.updateProgress(100, "Text extraction complete");

      return {
        text: result.data.text || "",
        words,
        confidence: result.data.confidence || 0,
      };
    } catch (error) {
      console.error("[OCR] Text extraction failed:", error);
      throw new Error(
        `Failed to extract text: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Terminate the Tesseract worker and free resources
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      this.updateProgress(0, "OCR engine terminated");
    }
  }

  /**
   * Check if the OCR engine is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Update progress and notify callback if set
   */
  private updateProgress(progress: number, status: string): void {
    if (this.progressCallback) {
      this.progressCallback(progress, status);
    }
  }
}

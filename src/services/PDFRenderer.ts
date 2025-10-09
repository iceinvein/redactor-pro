import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import * as pdfjsLib from "pdfjs-dist";
import type {
  PDFRenderer as IPDFRenderer,
  PageDimensions,
} from "../types/redaction";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export class PDFRenderer implements IPDFRenderer {
  private pdfDocument: PDFDocumentProxy | null = null;
  private currentRenderTask: RenderTask | null = null;

  /**
   * Load a PDF document from an ArrayBuffer
   * @param data - PDF file data as ArrayBuffer
   */
  async loadPDF(data: ArrayBuffer): Promise<void> {
    try {
      const loadingTask = pdfjsLib.getDocument({ data });
      this.pdfDocument = await loadingTask.promise;
    } catch (error) {
      throw new Error(
        `Failed to load PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get the total number of pages in the loaded PDF
   * @returns Number of pages
   */
  getPageCount(): number {
    if (!this.pdfDocument) {
      throw new Error("No PDF document loaded");
    }
    return this.pdfDocument.numPages;
  }

  /**
   * Render a specific page to a canvas with HiDPI support
   * @param pageNumber - Page number (1-indexed)
   * @param canvas - Target canvas element
   * @param scale - Zoom scale factor
   */
  async renderPage(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number,
  ): Promise<void> {
    if (!this.pdfDocument) {
      throw new Error("No PDF document loaded");
    }

    if (pageNumber < 1 || pageNumber > this.pdfDocument.numPages) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    // Cancel any ongoing render operation
    if (this.currentRenderTask) {
      try {
        this.currentRenderTask.cancel();
      } catch (_e) {
        // Ignore cancellation errors
      }
      this.currentRenderTask = null;
    }

    try {
      const page = await this.pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      // Support HiDPI displays
      const devicePixelRatio = window.devicePixelRatio || 1;
      const outputScale = devicePixelRatio;

      // Set canvas dimensions
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Failed to get canvas 2D context");
      }

      // Save context state before scaling
      context.save();

      // Scale context for HiDPI
      context.scale(outputScale, outputScale);

      // Fill with white background before rendering to prevent transparency issues
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, viewport.width, viewport.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      // @ts-expect-error - pdfjs-dist types may not match runtime API
      this.currentRenderTask = page.render(renderContext);
      await this.currentRenderTask.promise;
      this.currentRenderTask = null;

      // Restore context state after rendering
      context.restore();
    } catch (error) {
      this.currentRenderTask = null;
      // Don't throw error if it was just a cancellation
      if (error instanceof Error && error.message.includes("cancel")) {
        return;
      }
      throw new Error(
        `Failed to render page ${pageNumber}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get dimensions of a specific page
   * @param pageNumber - Page number (1-indexed)
   * @returns Page dimensions
   */
  async getPageDimensions(pageNumber: number): Promise<PageDimensions> {
    if (!this.pdfDocument) {
      throw new Error("No PDF document loaded");
    }

    if (pageNumber < 1 || pageNumber > this.pdfDocument.numPages) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    try {
      const page = await this.pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.0 });

      return {
        width: viewport.width,
        height: viewport.height,
      };
    } catch (error) {
      throw new Error(
        `Failed to get page dimensions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Extract a page as ImageData for OCR processing
   * @param pageNumber - Page number (1-indexed)
   * @returns ImageData object
   */
  async extractPageAsImage(pageNumber: number): Promise<ImageData> {
    if (!this.pdfDocument) {
      throw new Error("No PDF document loaded");
    }

    if (pageNumber < 1 || pageNumber > this.pdfDocument.numPages) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    try {
      const page = await this.pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR

      // Create off-screen canvas
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Failed to get canvas 2D context");
      }

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      // @ts-expect-error - pdfjs-dist types may not match runtime API
      await page.render(renderContext).promise;

      // Extract ImageData
      return context.getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
      throw new Error(
        `Failed to extract page as image: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

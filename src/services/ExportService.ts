import { jsPDF } from "jspdf";
import type { ExportService as IExportService } from "../types/redaction";

/**
 * ExportService handles exporting redacted documents as images or PDFs
 * Implements Requirements: 4.3, 4.4, 4.5, 4.6
 */
export class ExportService implements IExportService {
  /**
   * Export a single canvas as an image file
   * @param canvas - The canvas element containing the redacted document
   * @param originalName - Original filename to base the export name on
   * @param format - Image format ('png' or 'jpg')
   */
  async exportAsImage(
    canvas: HTMLCanvasElement,
    originalName: string,
    format: "png" | "jpg" = "png",
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const mimeType = format === "png" ? "image/png" : "image/jpeg";
      const quality = format === "jpg" ? 0.95 : undefined;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create image blob"));
            return;
          }

          const filename = this.generateFilename(originalName, format);
          this.triggerDownload(blob, filename);
          resolve();
        },
        mimeType,
        quality,
      );
    });
  }

  /**
   * Export multiple canvases as a multi-page PDF
   * @param pages - Array of canvas elements, one per page
   * @param originalName - Original filename to base the export name on
   */
  async exportAsPDF(
    pages: HTMLCanvasElement[],
    originalName: string,
  ): Promise<void> {
    if (pages.length === 0) {
      throw new Error("No pages to export");
    }

    // Get dimensions from first page
    const firstCanvas = pages[0];
    const width = firstCanvas.width;
    const height = firstCanvas.height;

    // Convert pixels to mm (assuming 96 DPI)
    const widthMM = (width * 25.4) / 96;
    const heightMM = (height * 25.4) / 96;

    // Create PDF with dimensions matching the canvas
    const pdf = new jsPDF({
      orientation: width > height ? "landscape" : "portrait",
      unit: "mm",
      format: [widthMM, heightMM],
    });

    // Add each page to the PDF
    for (let i = 0; i < pages.length; i++) {
      const canvas = pages[i];

      // Add a new page for all pages except the first
      if (i > 0) {
        pdf.addPage([widthMM, heightMM]);
      }

      // Convert canvas to image data
      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      // Add image to PDF, filling the entire page
      pdf.addImage(imgData, "JPEG", 0, 0, widthMM, heightMM);
    }

    // Generate filename and trigger download
    const filename = this.generateFilename(originalName, "pdf");
    const blob = pdf.output("blob");
    this.triggerDownload(blob, filename);
  }

  /**
   * Generate a filename with "_redacted" suffix
   * @param originalName - Original filename
   * @param extension - File extension without dot
   * @returns Filename with redacted suffix
   */
  private generateFilename(originalName: string, extension: string): string {
    // Remove existing extension
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");

    // Add _redacted suffix and new extension
    return `${nameWithoutExt}_redacted.${extension}`;
  }

  /**
   * Trigger browser download of a blob
   * @param blob - The blob to download
   * @param filename - The filename for the download
   */
  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

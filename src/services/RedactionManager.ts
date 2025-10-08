import type {
  RedactionManager as IRedactionManager,
  PIIDetection,
  PIIType,
  RedactionRegion,
} from "../types/redaction";

/**
 * RedactionManager
 *
 * Manages redaction regions across multiple pages, supporting both auto-detected
 * and manual redactions. Provides methods to add, remove, and apply redactions.
 */
export class RedactionManager implements IRedactionManager {
  private redactionsByPage: Map<number, RedactionRegion[]>;
  private currentPage: number;

  constructor() {
    this.redactionsByPage = new Map();
    this.currentPage = 1;
  }

  /**
   * Set the current page number for operations
   */
  setCurrentPage(pageNumber: number): void {
    this.currentPage = pageNumber;
  }

  /**
   * Get the current page number
   */
  getCurrentPage(): number {
    return this.currentPage;
  }

  /**
   * Add auto-detected PII regions to the current page
   */
  addAutoDetectedRegions(detections: PIIDetection[]): void {
    const regions: RedactionRegion[] = detections.map((detection) => {
      // Calculate bounding box from OCR words
      const bbox = this.calculateBoundingBox(detection.words);

      return {
        id: this.generateId(),
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
        piiType: detection.type,
        confidence: detection.confidence,
        isManual: false,
      };
    });

    this.addRegionsToPage(this.currentPage, regions);
  }

  /**
   * Add a manual redaction region to the current page
   */
  addManualRegion(region: RedactionRegion): void {
    const regionWithId = {
      ...region,
      id: region.id || this.generateId(),
      isManual: true,
    };

    this.addRegionsToPage(this.currentPage, [regionWithId]);
  }

  /**
   * Remove a redaction region by ID from the current page
   */
  removeRegion(regionId: string): void {
    const regions = this.redactionsByPage.get(this.currentPage);
    if (!regions) return;

    const filteredRegions = regions.filter((r) => r.id !== regionId);
    this.redactionsByPage.set(this.currentPage, filteredRegions);
  }

  /**
   * Get all redaction regions for the current page
   */
  getRegions(): RedactionRegion[] {
    return this.redactionsByPage.get(this.currentPage) || [];
  }

  /**
   * Get redaction regions by PII type for the current page
   */
  getRegionsByType(type: PIIType): RedactionRegion[] {
    const regions = this.getRegions();
    return regions.filter((r) => r.piiType === type);
  }

  /**
   * Get all redaction regions across all pages
   */
  getAllRegions(): Map<number, RedactionRegion[]> {
    return new Map(this.redactionsByPage);
  }

  /**
   * Get redaction regions for a specific page
   */
  getRegionsForPage(pageNumber: number): RedactionRegion[] {
    return this.redactionsByPage.get(pageNumber) || [];
  }

  /**
   * Clear all redaction regions from the current page
   */
  clearAllRegions(): void {
    this.redactionsByPage.delete(this.currentPage);
  }

  /**
   * Clear all redaction regions from all pages
   */
  clearAllPages(): void {
    this.redactionsByPage.clear();
  }

  /**
   * Apply redactions to a canvas by drawing black boxes
   */
  applyRedactions(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Cannot get canvas context");
    }

    const regions = this.getRegions();

    // Save the current canvas state
    ctx.save();

    // Draw black boxes over each redaction region
    ctx.fillStyle = "#000000";
    for (const region of regions) {
      ctx.fillRect(region.x, region.y, region.width, region.height);
    }

    // Restore the canvas state
    ctx.restore();
  }

  /**
   * Apply redactions to a specific page's canvas
   */
  applyRedactionsToPage(canvas: HTMLCanvasElement, pageNumber: number): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Cannot get canvas context");
    }

    const regions = this.getRegionsForPage(pageNumber);

    // Save the current canvas state
    ctx.save();

    // Draw black boxes over each redaction region
    ctx.fillStyle = "#000000";
    for (const region of regions) {
      ctx.fillRect(region.x, region.y, region.width, region.height);
    }

    // Restore the canvas state
    ctx.restore();
  }

  /**
   * Get total count of redaction regions across all pages
   */
  getTotalRegionCount(): number {
    let count = 0;
    for (const regions of this.redactionsByPage.values()) {
      count += regions.length;
    }
    return count;
  }

  /**
   * Get count of redaction regions for the current page
   */
  getRegionCount(): number {
    return this.getRegions().length;
  }

  // Private helper methods

  private addRegionsToPage(
    pageNumber: number,
    regions: RedactionRegion[],
  ): void {
    const existingRegions = this.redactionsByPage.get(pageNumber) || [];
    this.redactionsByPage.set(pageNumber, [...existingRegions, ...regions]);
  }

  private calculateBoundingBox(
    words: Array<{ bbox: { x0: number; y0: number; x1: number; y1: number } }>,
  ): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    if (words.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    // Find the minimum and maximum coordinates across all words
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const word of words) {
      minX = Math.min(minX, word.bbox.x0);
      minY = Math.min(minY, word.bbox.y0);
      maxX = Math.max(maxX, word.bbox.x1);
      maxY = Math.max(maxY, word.bbox.y1);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private generateId(): string {
    return `redaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

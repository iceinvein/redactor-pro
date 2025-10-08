import type {
  CanvasController as ICanvasController,
  Point,
  RedactionRegion,
} from "../types/redaction";

export class CanvasController implements ICanvasController {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private regions: RedactionRegion[] = [];
  private highlightedRegionId: string | null = null;
  private zoom = 1;
  private panOffset: Point = { x: 0, y: 0 };
  private devicePixelRatio: number;

  // Manual drawing state
  private isDrawing = false;
  private drawStartPoint: Point | null = null;
  private currentDrawRegion: RedactionRegion | null = null;
  private onRegionCreated?: (region: RedactionRegion) => void;

  // Performance optimization: off-screen canvas and page cache
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private pageCache: Map<number, ImageData> = new Map();
  private readonly MAX_CACHED_PAGES = 10;

  // Debouncing for zoom and pan
  private zoomDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private panDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly DEBOUNCE_DELAY = 16; // ~60fps

  constructor() {
    this.devicePixelRatio = window.devicePixelRatio || 1;
  }

  initialize(canvasElement: HTMLCanvasElement): void {
    this.canvas = canvasElement;
    const context = canvasElement.getContext("2d");

    if (!context) {
      throw new Error("Failed to get 2D context from canvas");
    }

    this.ctx = context;
    this.setupCanvas();
    this.setupOffscreenCanvas();
    this.attachEventListeners();
  }

  /**
   * Set up off-screen canvas for processing operations
   */
  private setupOffscreenCanvas(): void {
    if (!this.canvas) return;

    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;

    const ctx = this.offscreenCanvas.getContext("2d");
    if (!ctx) {
      console.warn("Failed to create off-screen canvas context");
      return;
    }

    this.offscreenCtx = ctx;
    this.offscreenCtx.scale(this.devicePixelRatio, this.devicePixelRatio);
  }

  private setupCanvas(): void {
    if (!this.canvas || !this.ctx) return;

    // Set up canvas for HiDPI displays
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this.devicePixelRatio;
    this.canvas.height = rect.height * this.devicePixelRatio;

    // Scale context to match device pixel ratio
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);

    // Set canvas CSS size
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
  }

  async renderPage(pageNumber: number): Promise<void> {
    // This method will be called by external renderers (PDF/Image)
    // The actual page rendering is delegated to PDFRenderer or ImageRenderer
    // This method is responsible for rendering redaction overlays after the page is rendered

    // Try to use cached page data if available
    const cachedPage = this.pageCache.get(pageNumber);
    if (cachedPage && this.ctx && this.canvas) {
      // Restore from cache
      this.ctx.putImageData(cachedPage, 0, 0);
    }

    this.renderRedactionOverlays();
  }

  /**
   * Cache the current page rendering for quick navigation
   * Automatically manages cache size to prevent memory issues
   */
  cachePage(pageNumber: number): void {
    if (!this.canvas || !this.ctx) return;

    try {
      // Get current canvas state
      const imageData = this.ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );

      // Add to cache
      this.pageCache.set(pageNumber, imageData);

      // Limit cache size - remove oldest entries
      if (this.pageCache.size > this.MAX_CACHED_PAGES) {
        const entriesToRemove = this.pageCache.size - this.MAX_CACHED_PAGES;
        const keys = Array.from(this.pageCache.keys());

        for (let i = 0; i < entriesToRemove; i++) {
          this.pageCache.delete(keys[i]);
        }
      }
    } catch (error) {
      console.warn("Failed to cache page:", error);
      // If caching fails (e.g., out of memory), clear the cache
      this.pageCache.clear();
    }
  }

  /**
   * Clear cached page data for a specific page or all pages
   */
  clearPageCache(pageNumber?: number): void {
    if (pageNumber !== undefined) {
      this.pageCache.delete(pageNumber);
    } else {
      this.pageCache.clear();
    }
  }

  /**
   * Clear cached pages that are far from the current page
   * Keeps pages within a certain range for quick navigation
   */
  clearDistantPages(currentPage: number, keepRange = 3): void {
    const pagesToKeep = new Set<number>();

    // Keep current page and nearby pages
    for (
      let i = Math.max(1, currentPage - keepRange);
      i <= currentPage + keepRange;
      i++
    ) {
      pagesToKeep.add(i);
    }

    // Remove pages outside the range
    for (const pageNum of this.pageCache.keys()) {
      if (!pagesToKeep.has(pageNum)) {
        this.pageCache.delete(pageNum);
      }
    }
  }

  private renderRedactionOverlays(): void {
    if (!this.ctx || !this.canvas) return;

    // Render all redaction regions
    for (const region of this.regions) {
      this.renderRegion(region, region.id === this.highlightedRegionId);
    }
  }

  private renderRegion(region: RedactionRegion, isHighlighted: boolean): void {
    if (!this.ctx) return;

    const transformedRegion = this.transformRegionToCanvas(region);

    this.ctx.save();

    // Draw semi-transparent overlay with better contrast
    // Using darker colors for better visibility and WCAG compliance
    this.ctx.fillStyle = isHighlighted
      ? "rgba(220, 38, 38, 0.5)" // Red-600 with 50% opacity for highlighted
      : "rgba(0, 0, 0, 0.4)"; // Black with 40% opacity for normal
    this.ctx.fillRect(
      transformedRegion.x,
      transformedRegion.y,
      transformedRegion.width,
      transformedRegion.height,
    );

    // Draw border with better contrast
    this.ctx.strokeStyle = isHighlighted ? "#dc2626" : "#1f2937"; // Red-600 or Gray-800
    this.ctx.lineWidth = isHighlighted ? 3 : 2;
    this.ctx.strokeRect(
      transformedRegion.x,
      transformedRegion.y,
      transformedRegion.width,
      transformedRegion.height,
    );

    this.ctx.restore();
  }

  private transformRegionToCanvas(region: RedactionRegion): RedactionRegion {
    // Apply zoom and pan transformations
    return {
      ...region,
      x: (region.x + this.panOffset.x) * this.zoom,
      y: (region.y + this.panOffset.y) * this.zoom,
      width: region.width * this.zoom,
      height: region.height * this.zoom,
    };
  }

  addRedactionRegion(region: RedactionRegion): void {
    this.regions.push(region);
    this.renderRedactionOverlays();
  }

  removeRedactionRegion(regionId: string): void {
    this.regions = this.regions.filter((r) => r.id !== regionId);
    this.renderRedactionOverlays();
  }

  highlightRegion(regionId: string): void {
    this.highlightedRegionId = regionId;
    this.renderRedactionOverlays();
  }

  clearHighlight(): void {
    this.highlightedRegionId = null;
    this.renderRedactionOverlays();
  }

  getCanvasCoordinates(x: number, y: number): Point {
    if (!this.canvas) {
      return { x: 0, y: 0 };
    }

    const rect = this.canvas.getBoundingClientRect();

    // Convert from screen coordinates to canvas coordinates
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    // Apply inverse transformations (zoom and pan)
    const documentX = canvasX / this.zoom - this.panOffset.x;
    const documentY = canvasY / this.zoom - this.panOffset.y;

    return { x: documentX, y: documentY };
  }

  setZoom(scale: number): void {
    this.zoom = Math.max(0.1, Math.min(5, scale)); // Clamp between 0.1x and 5x

    // Debounce zoom rendering for better performance
    if (this.zoomDebounceTimer) {
      clearTimeout(this.zoomDebounceTimer);
    }

    this.zoomDebounceTimer = setTimeout(() => {
      this.renderRedactionOverlays();
      this.zoomDebounceTimer = null;
    }, this.DEBOUNCE_DELAY);
  }

  setPan(offset: Point): void {
    this.panOffset = offset;

    // Debounce pan rendering for better performance
    if (this.panDebounceTimer) {
      clearTimeout(this.panDebounceTimer);
    }

    this.panDebounceTimer = setTimeout(() => {
      this.renderRedactionOverlays();
      this.panDebounceTimer = null;
    }, this.DEBOUNCE_DELAY);
  }

  getZoom(): number {
    return this.zoom;
  }

  getPan(): Point {
    return { ...this.panOffset };
  }

  getRegionAtPoint(point: Point): RedactionRegion | null {
    // Check regions in reverse order (top to bottom in rendering)
    for (let i = this.regions.length - 1; i >= 0; i--) {
      const region = this.regions[i];

      if (
        point.x >= region.x &&
        point.x <= region.x + region.width &&
        point.y >= region.y &&
        point.y <= region.y + region.height
      ) {
        return region;
      }
    }

    return null;
  }

  clearRegions(): void {
    this.regions = [];
    this.renderRedactionOverlays();
  }

  getRegions(): RedactionRegion[] {
    return [...this.regions];
  }

  getHighlightedRegionId(): string | null {
    return this.highlightedRegionId;
  }

  // Manual drawing functionality

  enableManualDrawing(
    onRegionCreated?: (region: RedactionRegion) => void,
  ): void {
    this.onRegionCreated = onRegionCreated;
  }

  disableManualDrawing(): void {
    this.onRegionCreated = undefined;
    this.cancelDrawing();
  }

  private attachEventListeners(): void {
    if (!this.canvas) return;

    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("mouseleave", this.handleMouseLeave);
  }

  private detachEventListeners(): void {
    if (!this.canvas) return;

    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    this.canvas.removeEventListener("mouseleave", this.handleMouseLeave);
  }

  private handleMouseDown = (event: MouseEvent): void => {
    if (!this.onRegionCreated) return; // Only draw if manual drawing is enabled

    const point = this.getCanvasCoordinates(event.clientX, event.clientY);

    this.isDrawing = true;
    this.drawStartPoint = point;
    this.currentDrawRegion = {
      id: `manual-${Date.now()}`,
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      isManual: true,
    };
  };

  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.canvas) return;

    const point = this.getCanvasCoordinates(event.clientX, event.clientY);

    // Handle hover highlighting
    if (!this.isDrawing) {
      const hoveredRegion = this.getRegionAtPoint(point);
      if (hoveredRegion) {
        this.canvas.style.cursor = "pointer";
        if (this.highlightedRegionId !== hoveredRegion.id) {
          this.highlightRegion(hoveredRegion.id);
        }
      } else {
        this.canvas.style.cursor = this.onRegionCreated
          ? "crosshair"
          : "default";
        if (this.highlightedRegionId) {
          this.clearHighlight();
        }
      }
    }

    // Handle drawing
    if (this.isDrawing && this.drawStartPoint && this.currentDrawRegion) {
      // Update current draw region dimensions
      const width = point.x - this.drawStartPoint.x;
      const height = point.y - this.drawStartPoint.y;

      // Normalize coordinates to handle drawing in any direction
      this.currentDrawRegion = {
        ...this.currentDrawRegion,
        x: width < 0 ? point.x : this.drawStartPoint.x,
        y: height < 0 ? point.y : this.drawStartPoint.y,
        width: Math.abs(width),
        height: Math.abs(height),
      };

      // Render with visual feedback
      this.renderDrawingFeedback();
    }
  };

  private handleMouseUp = (_event: MouseEvent): void => {
    if (!this.isDrawing || !this.currentDrawRegion) return;

    this.isDrawing = false;

    // Only create region if it has meaningful size (at least 5x5 pixels)
    if (
      this.currentDrawRegion.width >= 5 &&
      this.currentDrawRegion.height >= 5
    ) {
      if (this.onRegionCreated) {
        this.onRegionCreated(this.currentDrawRegion);
      }
      this.addRedactionRegion(this.currentDrawRegion);
    }

    this.currentDrawRegion = null;
    this.drawStartPoint = null;
  };

  private handleMouseLeave = (): void => {
    if (this.isDrawing) {
      this.cancelDrawing();
    }
    this.clearHighlight();
  };

  private cancelDrawing(): void {
    this.isDrawing = false;
    this.currentDrawRegion = null;
    this.drawStartPoint = null;
    this.renderRedactionOverlays();
  }

  private renderDrawingFeedback(): void {
    if (!this.ctx || !this.currentDrawRegion) return;

    // Re-render everything to clear previous feedback
    this.renderRedactionOverlays();

    // Draw the current drawing region with distinct visual feedback
    const transformedRegion = this.transformRegionToCanvas(
      this.currentDrawRegion,
    );

    this.ctx.save();

    // Draw dashed border for drawing feedback
    this.ctx.strokeStyle = "#0066ff";
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(
      transformedRegion.x,
      transformedRegion.y,
      transformedRegion.width,
      transformedRegion.height,
    );

    // Draw semi-transparent fill
    this.ctx.fillStyle = "rgba(0, 102, 255, 0.2)";
    this.ctx.fillRect(
      transformedRegion.x,
      transformedRegion.y,
      transformedRegion.width,
      transformedRegion.height,
    );

    this.ctx.restore();
  }

  /**
   * Get the off-screen canvas for processing operations
   * This allows heavy operations to be performed without affecting the visible canvas
   */
  getOffscreenCanvas(): HTMLCanvasElement | null {
    return this.offscreenCanvas;
  }

  /**
   * Process image data using the off-screen canvas
   * Useful for operations like applying filters or transformations
   */
  processInOffscreen(
    processor: (ctx: CanvasRenderingContext2D) => void,
  ): ImageData | null {
    if (!this.offscreenCanvas || !this.offscreenCtx || !this.canvas) {
      return null;
    }

    try {
      // Copy current canvas to offscreen
      this.offscreenCtx.drawImage(this.canvas, 0, 0);

      // Apply processing
      processor(this.offscreenCtx);

      // Get processed image data
      return this.offscreenCtx.getImageData(
        0,
        0,
        this.offscreenCanvas.width,
        this.offscreenCanvas.height,
      );
    } catch (error) {
      console.error("Error processing in offscreen canvas:", error);
      return null;
    }
  }

  destroy(): void {
    this.detachEventListeners();

    // Clear debounce timers
    if (this.zoomDebounceTimer) {
      clearTimeout(this.zoomDebounceTimer);
      this.zoomDebounceTimer = null;
    }
    if (this.panDebounceTimer) {
      clearTimeout(this.panDebounceTimer);
      this.panDebounceTimer = null;
    }

    // Clear caches
    this.pageCache.clear();

    // Clean up canvas references
    this.canvas = null;
    this.ctx = null;
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
    this.regions = [];
    this.highlightedRegionId = null;
    this.currentDrawRegion = null;
    this.drawStartPoint = null;
  }
}

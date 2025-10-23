import type {
  ImageRenderer as IImageRenderer,
  ImageDimensions,
} from "../types/redaction";

export class ImageRenderer implements IImageRenderer {
  private image: HTMLImageElement | null = null;
  private imageData: ImageData | null = null;

  /**
   * Load an image file using FileReader
   * @param file - Image file to load
   */
  async loadImage(file: File): Promise<void> {
    // Clean up previous image if it exists
    this.cleanup();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) {
          reject(new Error("Failed to read image file"));
          return;
        }

        const img = new Image();

        img.onload = () => {
          this.image = img;
          resolve();
        };

        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };

        img.src = dataUrl;
      };

      reader.onerror = () => {
        reject(new Error("Failed to read image file"));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Load an image from a data URL string
   * @param dataUrl - Data URL string
   */
  async loadImageFromDataURL(dataUrl: string): Promise<void> {
    // Clean up previous image if it exists
    this.cleanup();

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.image = img;
        resolve();
      };

      img.onerror = () => {
        reject(new Error("Failed to load image from data URL"));
      };

      img.src = dataUrl;
    });
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.image) {
      this.image.src = "";
      this.image = null;
    }
    this.imageData = null;
  }

  /**
   * Dispose of all resources (call this when done with the renderer)
   */
  dispose(): void {
    this.cleanup();
  }

  /**
   * Render the loaded image to a canvas with scaling support
   * @param canvas - Target canvas element
   * @param scale - Zoom scale factor
   */
  async renderImage(canvas: HTMLCanvasElement, scale: number): Promise<void> {
    if (!this.image) {
      throw new Error("No image loaded");
    }

    try {
      // Support HiDPI displays
      const devicePixelRatio = window.devicePixelRatio || 1;
      const outputScale = devicePixelRatio;

      // Calculate scaled dimensions
      const scaledWidth = this.image.width * scale;
      const scaledHeight = this.image.height * scale;

      // Set canvas dimensions
      canvas.width = Math.floor(scaledWidth * outputScale);
      canvas.height = Math.floor(scaledHeight * outputScale);
      canvas.style.width = `${Math.floor(scaledWidth)}px`;
      canvas.style.height = `${Math.floor(scaledHeight)}px`;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Failed to get canvas 2D context");
      }

      // Scale context for HiDPI
      context.scale(outputScale, outputScale);

      // Clear canvas
      context.clearRect(0, 0, scaledWidth, scaledHeight);

      // Draw image with scaling
      context.drawImage(this.image, 0, 0, scaledWidth, scaledHeight);
    } catch (error) {
      throw new Error(
        `Failed to render image: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get the dimensions of the loaded image
   * @returns Image dimensions
   */
  getImageDimensions(): ImageDimensions {
    if (!this.image) {
      throw new Error("No image loaded");
    }

    return {
      width: this.image.width,
      height: this.image.height,
    };
  }

  /**
   * Get ImageData for OCR processing
   * @returns ImageData object
   */
  getImageData(): ImageData {
    if (!this.image) {
      throw new Error("No image loaded");
    }

    // Create off-screen canvas for extracting ImageData
    const canvas = document.createElement("canvas");
    canvas.width = this.image.width;
    canvas.height = this.image.height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get canvas 2D context");
    }

    // Draw image to off-screen canvas
    context.drawImage(this.image, 0, 0);

    // Extract and cache ImageData
    this.imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    return this.imageData;
  }
}

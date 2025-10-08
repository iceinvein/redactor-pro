/**
 * Utility functions for screenshot fallback when export fails
 */

/**
 * Captures a canvas as a blob and triggers download
 * This is a fallback when normal export fails
 */
export async function downloadCanvasAsScreenshot(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create screenshot blob"));
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_screenshot.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      resolve();
    }, "image/png");
  });
}

/**
 * Copies canvas content to clipboard as an image
 * Alternative fallback option
 */
export async function copyCanvasToClipboard(
  canvas: HTMLCanvasElement,
): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error("Failed to create clipboard blob"));
        return;
      }

      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        resolve();
      } catch (error) {
        reject(
          new Error(
            `Failed to copy to clipboard: ${error instanceof Error ? error.message : "Unknown error"}`,
          ),
        );
      }
    }, "image/png");
  });
}

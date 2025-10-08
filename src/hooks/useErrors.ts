import { useCallback } from "react";
import { addToast } from "@/components/Toast";
import { ErrorType } from "@/types/redaction";

export function useErrors() {
  const showError = useCallback(
    (
      _type: ErrorType,
      message: string,
      recoverable = true,
      suggestedAction?: string,
    ) => {
      const description = suggestedAction
        ? `${message}\n\nSuggestion: ${suggestedAction}`
        : message;

      addToast({
        title: recoverable ? "Warning" : "Error",
        description,
        color: recoverable ? "warning" : "danger",
        timeout: recoverable ? 6000 : 10000,
      });
    },
    [],
  );

  const handleFileError = useCallback(
    (message: string) => {
      showError(
        ErrorType.INVALID_FILE_FORMAT,
        message,
        true,
        "Please upload a valid PDF or image file (PNG, JPG, JPEG)",
      );
    },
    [showError],
  );

  const handleOCRError = useCallback(
    (message: string) => {
      showError(
        ErrorType.OCR_FAILED,
        message,
        true,
        "You can still use manual redaction mode to mark sensitive areas",
      );
    },
    [showError],
  );

  const handlePIIDetectionError = useCallback(
    (message: string) => {
      showError(
        ErrorType.PII_DETECTION_FAILED,
        message,
        true,
        "Try using manual redaction mode or reload the document",
      );
    },
    [showError],
  );

  const handleExportError = useCallback(
    (message: string) => {
      showError(
        ErrorType.EXPORT_FAILED,
        message,
        true,
        "Try exporting in a different format or take a screenshot",
      );
    },
    [showError],
  );

  const handleCanvasError = useCallback(
    (message: string) => {
      showError(
        ErrorType.CANVAS_ERROR,
        message,
        true,
        "Try reloading the document or refreshing the page",
      );
    },
    [showError],
  );

  return {
    handleFileError,
    handleOCRError,
    handlePIIDetectionError,
    handleExportError,
    handleCanvasError,
  };
}

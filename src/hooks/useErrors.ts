import { useCallback, useState } from "react";
import { type AppError, ErrorType } from "@/types/redaction";

export function useErrors() {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = useCallback((error: AppError) => {
    setErrors((prev) => [...prev, error]);
  }, []);

  const createError = useCallback(
    (
      type: ErrorType,
      message: string,
      recoverable = true,
      suggestedAction?: string,
    ): AppError => {
      const error: AppError = {
        type,
        message,
        recoverable,
        suggestedAction,
      };
      addError(error);
      return error;
    },
    [addError],
  );

  const dismissError = useCallback((index: number) => {
    setErrors((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Helper methods for common error types
  const handleFileError = useCallback(
    (message: string) => {
      return createError(
        ErrorType.INVALID_FILE_FORMAT,
        message,
        true,
        "Please upload a valid PDF or image file (PNG, JPG, JPEG)",
      );
    },
    [createError],
  );

  const handleOCRError = useCallback(
    (message: string) => {
      return createError(
        ErrorType.OCR_FAILED,
        message,
        true,
        "You can still use manual redaction mode to mark sensitive areas",
      );
    },
    [createError],
  );

  const handlePIIDetectionError = useCallback(
    (message: string) => {
      return createError(
        ErrorType.PII_DETECTION_FAILED,
        message,
        true,
        "Try using manual redaction mode or reload the document",
      );
    },
    [createError],
  );

  const handleExportError = useCallback(
    (message: string) => {
      return createError(
        ErrorType.EXPORT_FAILED,
        message,
        true,
        "Try exporting in a different format or take a screenshot",
      );
    },
    [createError],
  );

  const handleCanvasError = useCallback(
    (message: string) => {
      return createError(
        ErrorType.CANVAS_ERROR,
        message,
        true,
        "Try reloading the document or refreshing the page",
      );
    },
    [createError],
  );

  const handleModelLoadError = useCallback(
    (message: string) => {
      return createError(
        ErrorType.MODEL_LOAD_FAILED,
        message,
        true,
        "The app will use basic pattern matching for PII detection",
      );
    },
    [createError],
  );

  return {
    errors,
    addError,
    createError,
    dismissError,
    clearErrors,
    handleFileError,
    handleOCRError,
    handlePIIDetectionError,
    handleExportError,
    handleCanvasError,
    handleModelLoadError,
  };
}

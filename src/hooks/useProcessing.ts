import { useCallback, useState } from "react";
import type { ProcessingStatus } from "@/types/redaction";

export function useProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    stage: "complete",
    progress: 0,
    message: "",
  });

  const startProcessing = useCallback(
    (stage: ProcessingStatus["stage"], message: string) => {
      setIsProcessing(true);
      setProcessingStatus({
        stage,
        progress: 0,
        message,
      });
    },
    [],
  );

  const updateProgress = useCallback((progress: number, message?: string) => {
    setProcessingStatus((prev) => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress)),
      message: message || prev.message,
    }));
  }, []);

  const updateStage = useCallback(
    (stage: ProcessingStatus["stage"], message: string) => {
      setProcessingStatus((prev) => ({
        ...prev,
        stage,
        message,
      }));
    },
    [],
  );

  const completeProcessing = useCallback((message = "Processing complete") => {
    setProcessingStatus({
      stage: "complete",
      progress: 100,
      message,
    });
    setIsProcessing(false);
  }, []);

  const errorProcessing = useCallback((message: string) => {
    setProcessingStatus({
      stage: "error",
      progress: 0,
      message,
    });
    setIsProcessing(false);
  }, []);

  const resetProcessing = useCallback(() => {
    setIsProcessing(false);
    setProcessingStatus({
      stage: "complete",
      progress: 0,
      message: "",
    });
  }, []);

  return {
    isProcessing,
    processingStatus,
    startProcessing,
    updateProgress,
    updateStage,
    completeProcessing,
    errorProcessing,
    resetProcessing,
  };
}

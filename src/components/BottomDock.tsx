import { Button } from "@heroui/button";
import { createPortal } from "react-dom";

interface BottomDockProps {
  hasDocument?: boolean;
  isProcessing?: boolean;
  statusText?: string;
  // Actions
  onDetectPII?: () => void | Promise<void>;
  onExport?: () => void | Promise<void>;
  hasRedactions?: boolean;
}

export const BottomDock = ({
  hasDocument = false,
  isProcessing = false,
  statusText,
  onDetectPII,
  onExport,
  hasRedactions = false,
}: BottomDockProps) => {
  return createPortal(
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-default-200/60 bg-default-50/95 dark:bg-default-950/95 backdrop-blur supports-[backdrop-filter]:bg-default-50/80 dark:supports-[backdrop-filter]:bg-default-950/80">
      <div className="mx-auto max-w-7xl">
        <div className="h-16 flex items-center justify-between px-6">
          {/* Status */}
          <div className="flex items-center min-w-[200px]">
            <span
              className={`text-sm ${isProcessing ? "animate-pulse text-primary font-medium" : "text-default-600"}`}
            >
              {statusText || (isProcessing ? "Processing..." : "Ready")}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              size="md"
              variant="flat"
              color="secondary"
              onPress={() => onDetectPII?.()}
              isDisabled={!hasDocument || isProcessing}
              className="min-w-[120px]"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="ml-2">Detect PII</span>
            </Button>
            <Button
              size="md"
              color="success"
              onPress={() => onExport?.()}
              isDisabled={!hasDocument || !hasRedactions || isProcessing}
              className="min-w-[120px]"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span className="ml-2">Export</span>
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

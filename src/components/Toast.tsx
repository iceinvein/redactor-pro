import { useEffect } from "react";
import type { AppError } from "@/types/redaction";

interface ToastProps {
  error: AppError;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function Toast({
  error,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
}: ToastProps) {
  useEffect(() => {
    if (autoClose && error.recoverable) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, error.recoverable, onClose]);

  const getIcon = () => {
    if (error.recoverable) {
      return (
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <title>Warning icon</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }
    return (
      <svg
        className="w-5 h-5 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <title>Error icon</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  };

  const bgColor = error.recoverable ? "bg-warning" : "bg-danger";
  const textColor = "text-white";

  return (
    <div
      className={`fixed bottom-4 right-4 ${bgColor} ${textColor} rounded-lg shadow-lg max-w-md z-50 animate-in slide-in-from-right duration-300`}
    >
      <div className="flex items-start gap-3 p-4">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className="font-semibold">
            {error.recoverable ? "Warning" : "Error"}
          </p>
          <p className="text-sm mt-1 break-words">{error.message}</p>
          {error.suggestedAction && (
            <p className="text-sm mt-2 opacity-90">
              <span className="font-medium">Suggestion:</span>{" "}
              {error.suggestedAction}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Close notification"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Close</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  errors: AppError[];
  onDismiss: (index: number) => void;
}

export function ToastContainer({ errors, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 pointer-events-none">
      {errors.map((error, index) => (
        <div key={`${error.type}-${index}`} className="pointer-events-auto">
          <Toast error={error} onClose={() => onDismiss(index)} />
        </div>
      ))}
    </div>
  );
}

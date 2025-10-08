import type { ProcessingStatus as ProcessingStatusType } from "@/types/redaction";

interface ProcessingStatusProps {
  status: ProcessingStatusType;
}

const STAGE_LABELS: Record<ProcessingStatusType["stage"], string> = {
  loading: "Loading Document",
  ocr: "Extracting Text (OCR)",
  "pii-detection": "Detecting PII",
  complete: "Processing Complete",
  error: "Error Occurred",
};

const STAGE_ICONS: Record<ProcessingStatusType["stage"], React.ReactNode> = {
  loading: (
    <svg
      className="w-6 h-6 animate-spin"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  ),
  ocr: (
    <svg
      className="w-6 h-6 animate-pulse"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  "pii-detection": (
    <svg
      className="w-6 h-6 animate-pulse"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  ),
  complete: (
    <svg
      className="w-6 h-6 text-success"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  error: (
    <svg
      className="w-6 h-6 text-danger"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

export const ProcessingStatus = ({ status }: ProcessingStatusProps) => {
  const { stage, progress, message } = status;

  if (stage === "complete") {
    return null; // Don't show anything when complete
  }

  const isError = stage === "error";
  const isProcessing =
    stage === "loading" || stage === "ocr" || stage === "pii-detection";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-default-100 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={`
            p-4 rounded-full
            ${isError ? "bg-danger/10" : "bg-primary/10"}
          `}
          >
            {STAGE_ICONS[stage]}
          </div>
        </div>

        {/* Stage Label */}
        <h3
          className={`
          text-xl font-semibold text-center mb-2
          ${isError ? "text-danger" : "text-default-900"}
        `}
        >
          {STAGE_LABELS[stage]}
        </h3>

        {/* Message */}
        <p className="text-sm text-default-600 text-center mb-6">{message}</p>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-default-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-default-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Loading Spinner for indeterminate progress */}
        {isProcessing && progress === 0 && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {/* Stage Indicators */}
        {isProcessing && (
          <div className="mt-6 flex justify-between items-center">
            <div
              className={`flex flex-col items-center ${
                stage === "loading" ? "text-primary" : "text-success"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  stage === "loading"
                    ? "bg-primary text-white"
                    : "bg-success text-white"
                }`}
              >
                {stage === "loading" ? (
                  <span className="text-xs">1</span>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span className="text-xs">Load</span>
            </div>

            <div className="flex-1 h-px bg-default-300 mx-2" />

            <div
              className={`flex flex-col items-center ${
                stage === "ocr"
                  ? "text-primary"
                  : stage === "pii-detection"
                    ? "text-success"
                    : "text-default-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  stage === "ocr"
                    ? "bg-primary text-white"
                    : stage === "pii-detection"
                      ? "bg-success text-white"
                      : "bg-default-200 text-default-400"
                }`}
              >
                {stage === "pii-detection" ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-xs">2</span>
                )}
              </div>
              <span className="text-xs">OCR</span>
            </div>

            <div className="flex-1 h-px bg-default-300 mx-2" />

            <div
              className={`flex flex-col items-center ${
                stage === "pii-detection" ? "text-primary" : "text-default-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  stage === "pii-detection"
                    ? "bg-primary text-white"
                    : "bg-default-200 text-default-400"
                }`}
              >
                <span className="text-xs">3</span>
              </div>
              <span className="text-xs">Detect</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

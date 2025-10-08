import { Button } from "@heroui/button";
import { InteractionMode } from "@/types/redaction";

interface RedactionToolbarProps {
  mode: InteractionMode;
  onModeChange: (mode: InteractionMode) => void;
  onDetectPII: () => void;
  onClearAll: () => void;
  onUploadNew?: () => void;
  isProcessing?: boolean;
  hasDocument?: boolean;
  manualOnlyMode?: boolean;
}

export const RedactionToolbar = ({
  mode,
  onModeChange,
  onDetectPII,
  onClearAll,
  onUploadNew,
  isProcessing = false,
  hasDocument = false,
  manualOnlyMode = false,
}: RedactionToolbarProps) => {
  return (
    <nav
      className="flex items-center gap-4 p-4 border-b border-default-200 bg-default-50"
      aria-label="Redaction toolbar"
    >
      {/* Upload New Document Button */}
      {hasDocument && onUploadNew && (
        <>
          <Button
            size="sm"
            variant="flat"
            onPress={onUploadNew}
            isDisabled={isProcessing}
            aria-label="Upload a new document"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Upload New
          </Button>
          <div className="h-8 w-px bg-default-300" />
        </>
      )}
      {/* Mode Toggle Buttons */}
      <div
        className="flex items-center gap-2"
        role="group"
        aria-label="Interaction mode selection"
      >
        <span
          className="text-sm font-medium text-default-600 mr-2"
          id="mode-label"
        >
          Mode:
        </span>

        <Button
          size="sm"
          variant={mode === InteractionMode.VIEW ? "solid" : "flat"}
          color={mode === InteractionMode.VIEW ? "primary" : "default"}
          onPress={() => onModeChange(InteractionMode.VIEW)}
          isDisabled={!hasDocument}
          aria-label="Switch to view mode"
          aria-pressed={mode === InteractionMode.VIEW}
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          View
        </Button>

        <Button
          size="sm"
          variant={mode === InteractionMode.MANUAL_REDACT ? "solid" : "flat"}
          color={mode === InteractionMode.MANUAL_REDACT ? "primary" : "default"}
          onPress={() => onModeChange(InteractionMode.MANUAL_REDACT)}
          isDisabled={!hasDocument}
          aria-label="Switch to manual redaction mode"
          aria-pressed={mode === InteractionMode.MANUAL_REDACT}
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
          Manual Redact
        </Button>

        <Button
          size="sm"
          variant={mode === InteractionMode.REVIEW ? "solid" : "flat"}
          color={mode === InteractionMode.REVIEW ? "primary" : "default"}
          onPress={() => onModeChange(InteractionMode.REVIEW)}
          isDisabled={!hasDocument}
          aria-label="Switch to review mode"
          aria-pressed={mode === InteractionMode.REVIEW}
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          Review
        </Button>
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-default-300" />

      {/* Action Buttons */}
      <div
        className="flex items-center gap-2"
        role="group"
        aria-label="Redaction actions"
      >
        <Button
          size="sm"
          color="secondary"
          variant="flat"
          onPress={onDetectPII}
          isDisabled={!hasDocument || isProcessing || manualOnlyMode}
          isLoading={isProcessing}
          aria-label="Automatically detect personally identifiable information"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Detect PII
        </Button>

        {manualOnlyMode && (
          <div
            className="flex items-center gap-2 px-3 py-1 bg-warning-50 border border-warning-200 rounded-md"
            role="alert"
            aria-live="polite"
          >
            <svg
              className="w-4 h-4 text-warning-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-xs text-warning-800 font-medium">
              Auto-detection unavailable - Use manual mode
            </span>
          </div>
        )}

        <Button
          size="sm"
          color="danger"
          variant="flat"
          onPress={onClearAll}
          isDisabled={!hasDocument}
          aria-label="Clear all redaction regions"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Clear All
        </Button>
      </div>

      {/* Current Mode Indicator */}
      <div
        className="ml-auto flex items-center gap-2"
        role="status"
        aria-live="polite"
      >
        <span className="text-xs text-default-500">Current mode:</span>
        <span className="text-sm font-semibold text-primary capitalize">
          {mode.replace("-", " ")}
        </span>
      </div>
    </nav>
  );
};

import { Button } from "@heroui/button";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { InteractionMode } from "@/types/redaction";

interface MobileToolbarProps {
  mode: InteractionMode;
  onModeChange: (mode: InteractionMode) => void;
  onClearAll: () => void;
  onUploadNew: () => void;
  isProcessing?: boolean;
  hasDocument?: boolean;
  manualOnlyMode?: boolean;
}

export const MobileToolbar = ({
  mode,
  onModeChange,
  onClearAll,
  onUploadNew,
  isProcessing = false,
  hasDocument = false,
  manualOnlyMode = false,
}: MobileToolbarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="lg:hidden">
      {/* Toolbar toggle button */}
      <div className="border-b border-default-200 bg-default-50/95 backdrop-blur p-2">
        <Button
          size="sm"
          variant="flat"
          onPress={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Collapse toolbar" : "Expand toolbar"}
          aria-expanded={isExpanded}
          className="w-full justify-between"
        >
          <span className="text-sm font-medium">
            {isExpanded ? "Hide Controls" : "Show Controls"}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="border-b border-default-200 bg-default-50 p-3 space-y-3">
          {/* Upload New */}
          {hasDocument && (
            <div>
              <Button
                size="sm"
                variant="flat"
                onPress={onUploadNew}
                isDisabled={isProcessing}
                className="w-full"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload New Document
              </Button>
            </div>
          )}

          {/* Modes */}
          <div>
            <h3 className="text-xs uppercase tracking-wide text-default-500 mb-2">
              Mode
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant={mode === InteractionMode.VIEW ? "solid" : "flat"}
                color={mode === InteractionMode.VIEW ? "primary" : "default"}
                onPress={() => onModeChange(InteractionMode.VIEW)}
                isDisabled={!hasDocument}
                className="flex-col h-auto py-2"
              >
                <svg
                  className="w-5 h-5 mb-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
                <span className="text-xs">View</span>
              </Button>

              <Button
                size="sm"
                variant={
                  mode === InteractionMode.MANUAL_REDACT ? "solid" : "flat"
                }
                color={
                  mode === InteractionMode.MANUAL_REDACT ? "primary" : "default"
                }
                onPress={() => onModeChange(InteractionMode.MANUAL_REDACT)}
                isDisabled={!hasDocument}
                className="flex-col h-auto py-2"
              >
                <svg
                  className="w-5 h-5 mb-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                <span className="text-xs">Redact</span>
              </Button>

              <Button
                size="sm"
                variant={mode === InteractionMode.REVIEW ? "solid" : "flat"}
                color={mode === InteractionMode.REVIEW ? "primary" : "default"}
                onPress={() => onModeChange(InteractionMode.REVIEW)}
                isDisabled={!hasDocument}
                className="flex-col h-auto py-2"
              >
                <svg
                  className="w-5 h-5 mb-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <span className="text-xs">Review</span>
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-xs uppercase tracking-wide text-default-500 mb-2">
              Actions
            </h3>
            <Button
              size="sm"
              color="danger"
              variant="flat"
              onPress={onClearAll}
              isDisabled={!hasDocument}
              className="w-full"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Clear All Redactions
            </Button>
          </div>

          {/* Warning message */}
          {manualOnlyMode && (
            <div className="text-xs text-warning-700 bg-warning-50 border border-warning-200 rounded-md p-2 flex items-start gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>Auto-detection unavailable — use Manual Redact mode</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

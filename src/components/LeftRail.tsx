import { Button } from "@heroui/button";
import { InteractionMode } from "@/types/redaction";

interface LeftRailProps {
  mode: InteractionMode;
  onModeChange: (mode: InteractionMode) => void;
  onClearAll: () => void;
  onUploadNew?: () => void;
  isProcessing?: boolean;
  hasDocument?: boolean;
  manualOnlyMode?: boolean;
}

interface RailButtonProps {
  active?: boolean;
  onPress: () => void;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

const RailButton = ({
  active,
  onPress,
  label,
  icon,
  disabled,
}: RailButtonProps) => (
  <Button
    size="sm"
    variant={active ? "solid" : "flat"}
    color={active ? "primary" : "default"}
    onPress={onPress}
    isDisabled={disabled}
    className="justify-start"
    aria-pressed={active}
  >
    <span className="w-4 h-4 mr-2" aria-hidden>
      {icon}
    </span>
    {label}
  </Button>
);

export const LeftRail = ({
  mode,
  onModeChange,
  onClearAll,
  onUploadNew,
  isProcessing = false,
  hasDocument = false,
  manualOnlyMode = false,
}: LeftRailProps) => {
  return (
    <aside className="border-r border-default-200 bg-default-50/80 dark:bg-default-100/80 p-3 flex flex-col gap-3 overflow-auto">
      {/* Upload New (if a document is loaded) */}
      {hasDocument && onUploadNew && (
        <Button
          size="sm"
          variant="flat"
          onPress={onUploadNew}
          isDisabled={isProcessing}
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
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
      )}

      {/* Modes */}
      <div className="mt-1">
        <p className="text-[11px] uppercase tracking-wide text-default-500 mb-2">
          Modes
        </p>
        <div className="flex flex-col gap-2">
          <RailButton
            active={mode === InteractionMode.VIEW}
            onPress={() => onModeChange(InteractionMode.VIEW)}
            label="View"
            disabled={!hasDocument}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            }
          />
          <RailButton
            active={mode === InteractionMode.MANUAL_REDACT}
            onPress={() => onModeChange(InteractionMode.MANUAL_REDACT)}
            label="Manual Redact"
            disabled={!hasDocument}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            }
          />
          <RailButton
            active={mode === InteractionMode.REVIEW}
            onPress={() => onModeChange(InteractionMode.REVIEW)}
            label="Review"
            disabled={!hasDocument}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            }
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-2">
        <p className="text-[11px] uppercase tracking-wide text-default-500 mb-2">
          Actions
        </p>
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="flat"
            color="danger"
            onPress={onClearAll}
            isDisabled={!hasDocument}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
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
          {manualOnlyMode && (
            <div className="text-xs text-warning-700 bg-warning-50 border border-warning-200 rounded-md p-2">
              Auto-detection unavailable — use Manual Redact
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

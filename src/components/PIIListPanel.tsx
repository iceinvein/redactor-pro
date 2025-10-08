import { Switch } from "@heroui/switch";
import { AnimatePresence, motion } from "framer-motion";
import { type PIIDetection, PIIType } from "@/types/redaction";

interface PIIListPanelProps {
  detections: PIIDetection[];
  enabledDetections: Set<string>;
  onToggleDetection: (detectionId: string, enabled: boolean) => void;
  onHighlightDetection: (detectionId: string | null) => void;
}

const PII_TYPE_COLORS: Record<PIIType, string> = {
  [PIIType.NAME]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  [PIIType.EMAIL]:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  [PIIType.PHONE]:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  [PIIType.SSN]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  [PIIType.ADDRESS]:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  [PIIType.DATE_OF_BIRTH]:
    "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  [PIIType.CREDIT_CARD]:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  [PIIType.OTHER]:
    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const PII_TYPE_LABELS: Record<PIIType, string> = {
  [PIIType.NAME]: "Name",
  [PIIType.EMAIL]: "Email",
  [PIIType.PHONE]: "Phone",
  [PIIType.SSN]: "SSN",
  [PIIType.ADDRESS]: "Address",
  [PIIType.DATE_OF_BIRTH]: "Date of Birth",
  [PIIType.CREDIT_CARD]: "Credit Card",
  [PIIType.OTHER]: "Other",
};

export const PIIListPanel = ({
  detections,
  enabledDetections,
  onToggleDetection,
  onHighlightDetection,
}: PIIListPanelProps) => {
  const getDetectionId = (detection: PIIDetection, index: number): string => {
    return `${detection.type}-${detection.startIndex}-${index}`;
  };

  const truncateText = (text: string, maxLength = 30): string => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return "text-success";
    if (confidence >= 0.5) return "text-warning";
    return "text-danger";
  };

  return (
    <aside
      className="w-80 border-l border-default-200 bg-default-50/70 backdrop-blur supports-[backdrop-filter]:bg-default-50/50 flex flex-col h-full"
      aria-label="Detected PII panel"
    >
      {/* Header */}
      <div className="p-4 border-b border-default-200/60">
        <h3 className="text-lg font-semibold">Detected PII</h3>
        <output
          className="text-sm text-default-500 mt-1 block"
          aria-live="polite"
        >
          {detections.length} item{detections.length !== 1 ? "s" : ""} found
        </output>
      </div>

      {/* List */}
      <section
        className="flex-1 overflow-y-auto"
        aria-label="PII detection list"
      >
        {detections.length === 0 ? (
          <div className="p-8 text-center">
            <svg
              className="w-16 h-16 mx-auto text-default-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm text-default-500">
              No PII detected yet.
              <br />
              Click "Detect PII" to scan the document.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-default-200">
            <AnimatePresence initial={false}>
              {detections.map((detection, index) => {
                const detectionId = getDetectionId(detection, index);
                const isEnabled = enabledDetections.has(detectionId);

                return (
                  <motion.li
                    key={detectionId}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    <motion.button
                      type="button"
                      className="w-full p-4 hover:bg-default-100 transition-colors cursor-pointer text-left"
                      onClick={() => onHighlightDetection(detectionId)}
                      onMouseEnter={() => onHighlightDetection(detectionId)}
                      onMouseLeave={() => onHighlightDetection(null)}
                      aria-label={`${PII_TYPE_LABELS[detection.type]}: ${truncateText(detection.text)}, confidence ${Math.round(detection.confidence * 100)}%, ${isEnabled ? "enabled" : "disabled"}`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      transition={{ duration: 0.08 }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* PII Type Badge */}
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${
                              PII_TYPE_COLORS[detection.type]
                            }`}
                            aria-hidden="true"
                          >
                            {PII_TYPE_LABELS[detection.type]}
                          </span>

                          {/* Text Preview */}
                          <p
                            className="text-sm font-mono break-words mb-2"
                            aria-hidden="true"
                          >
                            {truncateText(detection.text)}
                          </p>

                          {/* Confidence */}
                          <div
                            className="flex items-center gap-2 text-xs"
                            aria-hidden="true"
                          >
                            <span className="text-default-500">Confidence:</span>
                            <span
                              className={`font-semibold ${getConfidenceColor(detection.confidence)}`}
                            >
                              {Math.round(detection.confidence * 100)}%
                            </span>
                          </div>
                        </div>

                        {/* Toggle Switch */}
                        <Switch
                          size="sm"
                          isSelected={isEnabled}
                          onValueChange={(enabled) =>
                            onToggleDetection(detectionId, enabled)
                          }
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`${isEnabled ? "Disable" : "Enable"} redaction for this ${PII_TYPE_LABELS[detection.type]}`}
                        />
                      </div>
                    </motion.button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </section>

      {/* Footer Stats */}
      {detections.length > 0 && (
        <footer className="p-4 border-t border-default-200 bg-default-100/70 backdrop-blur">
          <h4 className="sr-only">Redaction Statistics</h4>
          <output className="text-xs text-default-600 block">
            <div className="flex justify-between mb-1">
              <span>Enabled:</span>
              <span className="font-semibold">{enabledDetections.size}</span>
            </div>
            <div className="flex justify-between">
              <span>Total:</span>
              <span className="font-semibold">{detections.length}</span>
            </div>
          </output>
        </footer>
      )}
    </aside>
  );
};

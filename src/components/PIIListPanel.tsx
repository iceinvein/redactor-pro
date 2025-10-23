import { Card, CardBody } from "@heroui/card";
import { Switch } from "@heroui/switch";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  CreditCard,
  FileText,
  type LucideIcon,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
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

const PII_TYPE_ICONS: Record<PIIType, LucideIcon> = {
  [PIIType.NAME]: User,
  [PIIType.EMAIL]: Mail,
  [PIIType.PHONE]: Phone,
  [PIIType.SSN]: Shield,
  [PIIType.ADDRESS]: MapPin,
  [PIIType.DATE_OF_BIRTH]: Calendar,
  [PIIType.CREDIT_CARD]: CreditCard,
  [PIIType.OTHER]: FileText,
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

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return "text-success";
    if (confidence >= 0.5) return "text-warning";
    return "text-danger";
  };

  // Defensive check: ensure detections is an array and filter out invalid entries
  const safeDetections = Array.isArray(detections)
    ? detections.filter(d => {
      if (!d || typeof d !== 'object') return false;
      if (!d.type || !d.text) return false;
      if (!d.words || !Array.isArray(d.words)) return false;
      if (typeof d.confidence !== 'number') return false;
      return true;
    })
    : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Detected PII</h3>
        {safeDetections.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary">
            {safeDetections.length} item{safeDetections.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {safeDetections.length === 0 ? (
          <EmptyState
            icon="search"
            title="No PII detected yet"
            description="Click 'Detect PII' to scan the document for sensitive information"
          />
        ) : (
          <div className="space-y-2 pr-1">
            <AnimatePresence initial={false}>
              {safeDetections.map((detection, index) => {
                const detectionId = getDetectionId(detection, index);
                const isEnabled = enabledDetections.has(detectionId);
                const Icon = PII_TYPE_ICONS[detection.type] || FileText;

                return (
                  <motion.div
                    key={detectionId}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                  >
                    <Card
                      isPressable
                      isHoverable
                      onPress={() => onHighlightDetection(detectionId)}
                      className={`bg-content2/50 backdrop-blur-sm border transition-all duration-200 w-full ${isEnabled
                          ? "border-primary/50 shadow-md"
                          : "border-divider/50 opacity-60"
                        }`}
                    >
                      <CardBody className="p-3">
                        <div className="flex items-center gap-3">
                          {/* Icon */}
                          <div
                            className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${PII_TYPE_COLORS[detection.type] || PII_TYPE_COLORS[PIIType.OTHER]
                              }`}
                          >
                            <Icon className="w-6 h-6" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Type Label and Switch */}
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-sm font-bold text-foreground">
                                {PII_TYPE_LABELS[detection.type] || "Unknown"}
                              </span>
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

                            {/* Text Preview */}
                            <p className="text-xs font-mono text-default-600 mb-2 break-words line-clamp-1">
                              {detection.text}
                            </p>

                            {/* Confidence Progress Bar */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <div className="h-1.5 bg-default-200 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${detection.confidence * 100}%`,
                                    }}
                                    transition={{
                                      duration: 0.5,
                                      delay: index * 0.05,
                                    }}
                                    className={`h-full rounded-full ${detection.confidence >= 0.8
                                        ? "bg-success"
                                        : detection.confidence >= 0.5
                                          ? "bg-warning"
                                          : "bg-danger"
                                      }`}
                                  />
                                </div>
                              </div>
                              <span
                                className={`text-xs font-bold shrink-0 ${getConfidenceColor(
                                  detection.confidence,
                                )}`}
                              >
                                {Math.round(detection.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {safeDetections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 pt-3 border-t border-divider/50"
        >
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
            <CardBody className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-default-600 font-medium">
                      Active Redactions
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {enabledDetections.size}/{safeDetections.length}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-foreground">
                    {Math.round(
                      (enabledDetections.size / safeDetections.length) * 100,
                    )}
                    %
                  </div>
                  <div className="text-xs text-default-500 font-medium">
                    Coverage
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

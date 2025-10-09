import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { motion } from "framer-motion";
import {
  Download,
  Eye,
  FileText,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo } from "react";
import { EmptyState } from "@/components/EmptyState";
import { HistoryActionType, type HistoryEntry } from "@/types/redaction";

interface HistoryPanelProps {
  history: HistoryEntry[];
  onClearHistory: () => void;
}

const getActionIcon = (action: HistoryActionType) => {
  switch (action) {
    case HistoryActionType.DOCUMENT_UPLOADED:
      return <Upload className="w-4 h-4" />;
    case HistoryActionType.PII_DETECTION_RUN:
      return <Search className="w-4 h-4" />;
    case HistoryActionType.MANUAL_REDACTION_ADDED:
      return <Pencil className="w-4 h-4" />;
    case HistoryActionType.REDACTION_REMOVED:
      return <Trash2 className="w-4 h-4" />;
    case HistoryActionType.DETECTION_TOGGLED:
      return <RotateCcw className="w-4 h-4" />;
    case HistoryActionType.EXPORT_COMPLETED:
      return <Download className="w-4 h-4" />;
    case HistoryActionType.MODE_CHANGED:
      return <Eye className="w-4 h-4" />;
    case HistoryActionType.PAGE_CLEARED:
    case HistoryActionType.ALL_CLEARED:
      return <Trash2 className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getActionColor = (action: HistoryActionType): string => {
  switch (action) {
    case HistoryActionType.DOCUMENT_UPLOADED:
      return "text-primary";
    case HistoryActionType.PII_DETECTION_RUN:
      return "text-secondary";
    case HistoryActionType.MANUAL_REDACTION_ADDED:
      return "text-success";
    case HistoryActionType.REDACTION_REMOVED:
    case HistoryActionType.PAGE_CLEARED:
    case HistoryActionType.ALL_CLEARED:
      return "text-danger";
    case HistoryActionType.EXPORT_COMPLETED:
      return "text-primary";
    case HistoryActionType.DETECTION_TOGGLED:
      return "text-warning";
    case HistoryActionType.MODE_CHANGED:
      return "text-default-500";
    default:
      return "text-default-500";
  }
};

const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) {
    return "Just now";
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const HistoryPanel = ({
  history,
  onClearHistory,
}: HistoryPanelProps) => {
  const sortedHistory = useMemo(() => {
    return [...history].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }, [history]);

  if (sortedHistory.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">History</h3>
        </div>
        <EmptyState
          icon="search"
          title="No history yet"
          description="Your redaction actions will appear here"
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">History</h3>
        <Button
          size="sm"
          variant="flat"
          color="danger"
          onPress={onClearHistory}
          className="text-xs"
        >
          Clear All
        </Button>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto">
        {sortedHistory.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card className="bg-content2/50 backdrop-blur-sm border border-divider/50 hover:border-primary/30 transition-colors">
              <CardBody className="p-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-lg bg-default-100 flex items-center justify-center ${getActionColor(
                      entry.action,
                    )}`}
                  >
                    {getActionIcon(entry.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {entry.description}
                      </p>
                      <span className="text-xs text-default-400 whitespace-nowrap">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                    {entry.metadata &&
                      Object.keys(entry.metadata).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {entry.metadata.page !== undefined && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-default-100 text-default-600">
                              Page {entry.metadata.page}
                            </span>
                          )}
                          {entry.metadata.count !== undefined && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {entry.metadata.count} item
                              {entry.metadata.count !== 1 ? "s" : ""}
                            </span>
                          )}
                          {entry.metadata.format && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary uppercase">
                              {entry.metadata.format}
                            </span>
                          )}
                          {entry.metadata.mode && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success capitalize">
                              {entry.metadata.mode.replace("-", " ")}
                            </span>
                          )}
                          {entry.metadata.piiType && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning capitalize">
                              {entry.metadata.piiType.replace("_", " ")}
                            </span>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

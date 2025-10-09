import { Button } from "@heroui/button";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { Scan, Download } from "lucide-react";

interface BottomDockProps {
  hasDocument?: boolean;
  isProcessing?: boolean;
  statusText?: string;
  // Actions
  onDetectPII?: () => void | Promise<void>;
  onExport?: () => void | Promise<void>;
  hasRedactions?: boolean;
  hasRunDetection?: boolean;
}

export const BottomDock = ({
  hasDocument = false,
  isProcessing = false,
  statusText,
  onDetectPII,
  onExport,
  hasRedactions = false,
  hasRunDetection = false,
}: BottomDockProps) => {
  return createPortal(
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-divider/50 bg-content1/80 backdrop-blur-2xl shadow-2xl"
    >
      <div className="mx-auto max-w-7xl">
        <div className="h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Status - hidden on mobile */}
          <div className="hidden lg:flex items-center min-w-[240px]">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isProcessing
                    ? "bg-primary animate-pulse"
                    : "bg-success"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  isProcessing ? "text-primary" : "text-default-600"
                }`}
              >
                {statusText || (isProcessing ? "Processing..." : "Ready")}
              </span>
            </div>
          </div>

          {/* Actions - responsive layout */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 lg:flex-initial justify-end">
            {/* Detect PII Button */}
            <Button
              size="lg"
              variant="shadow"
              color="secondary"
              onPress={() => onDetectPII?.()}
              isDisabled={!hasDocument || isProcessing || hasRunDetection}
              className="font-semibold"
              startContent={<Scan className="w-5 h-5" />}
            >
              <span className="hidden sm:inline">{hasRunDetection ? "Already Detected" : "Detect PII"}</span>
            </Button>
            
            {/* Export Button */}
            <Button
              size="lg"
              variant="shadow"
              color="success"
              onPress={() => onExport?.()}
              isDisabled={!hasDocument || !hasRedactions || isProcessing}
              className="font-semibold"
              startContent={<Download className="w-5 h-5" />}
            >
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>,
    document.body,
  );
};

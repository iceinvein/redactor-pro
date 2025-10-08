import { Button, ButtonGroup } from "@heroui/button";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ExportPanelProps {
  onExport: (format: "pdf" | "png") => Promise<void>;
  hasDocument?: boolean;
  hasRedactions?: boolean;
}

export const ExportPanel = ({
  onExport,
  hasDocument = false,
  hasRedactions = false,
}: ExportPanelProps) => {
  const [selectedFormat, setSelectedFormat] = useState<"pdf" | "png">("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  useEffect(() => {
    if (!isExporting) return;
    // Smooth progress while exporting to give feedback
    const id = setInterval(() => {
      setExportProgress((p) => Math.min(90, p + 2));
    }, 80);
    return () => clearInterval(id);
  }, [isExporting]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      await onExport(selectedFormat);
      setExportProgress(100);
      // Reset after a short delay
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 700);
    } catch (error) {
      setIsExporting(false);
      setExportProgress(0);
      throw error;
    }
  };

  return (
    <section
      className="p-4 border-t border-default-200 bg-default-50/70 backdrop-blur"
      aria-label="Export document panel"
    >
      <h3 className="text-sm font-semibold mb-3">Export Document</h3>

      {/* Format Selection */}
      <fieldset className="mb-4">
        <legend className="text-xs text-default-600 mb-2 block">
          Export Format
        </legend>
        <ButtonGroup className="w-full">
          <Button
            size="md"
            variant={selectedFormat === "pdf" ? "solid" : "flat"}
            color={selectedFormat === "pdf" ? "primary" : "default"}
            onPress={() => setSelectedFormat("pdf")}
            className="flex-1"
            aria-label="Export as PDF"
            aria-pressed={selectedFormat === "pdf"}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <span className="ml-2">PDF</span>
          </Button>

          <Button
            size="md"
            variant={selectedFormat === "png" ? "solid" : "flat"}
            color={selectedFormat === "png" ? "primary" : "default"}
            onPress={() => setSelectedFormat("png")}
            className="flex-1"
            aria-label="Export as PNG"
            aria-pressed={selectedFormat === "png"}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="ml-2">PNG</span>
          </Button>
        </ButtonGroup>
      </fieldset>

      {/* Export Progress */}
      {isExporting && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-default-600 mb-1">
            <span>Exporting...</span>
            <output aria-live="polite">{exportProgress}%</output>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden bg-default-200">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${exportProgress}%` }}
              transition={{ ease: "easeOut", duration: 0.2 }}
            />
          </div>
        </div>
      )}

      {/* Export Button */}
      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          color="success"
          size="lg"
          className="w-full"
          onPress={handleExport}
          isDisabled={!hasDocument || !hasRedactions || isExporting}
          isLoading={isExporting}
          aria-label="Export redacted document"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span className="ml-2">
            {isExporting ? "Exporting..." : "Export"}
          </span>
        </Button>
      </motion.div>

      {/* Info Text */}
      <output className="mt-3 text-xs text-default-600 block text-center">
        {!hasDocument && <p>Upload a document to enable export.</p>}
        {hasDocument && !hasRedactions && (
          <p className="text-warning-600">Add redactions to enable export.</p>
        )}
        {hasDocument && hasRedactions && (
          <p className="text-success-600">
            Ready to export with {hasRedactions ? "redactions" : "no changes"}.
          </p>
        )}
      </output>
    </section>
  );
};

import { Button } from "@heroui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useState } from "react";
import { Upload, FileText, Image as ImageIcon } from "lucide-react";
import { type Document, DocumentType } from "@/types/redaction";

interface DocumentUploadProps {
  onDocumentLoad: (document: Document) => void;
  onError: (error: string) => void;
}

const ACCEPTED_FORMATS = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const DocumentUpload = ({
  onDocumentLoad,
  onError,
}: DocumentUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return "Invalid file format. Please upload a PDF or image file (PNG, JPG, JPEG).";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 50MB limit.";
    }
    return null;
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        onError(error);
        return;
      }

      setIsUploading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const documentType =
          file.type === "application/pdf"
            ? DocumentType.PDF
            : DocumentType.IMAGE;

        const document: Document = {
          id: crypto.randomUUID(),
          type: documentType,
          name: file.name,
          pageCount: documentType === DocumentType.PDF ? 0 : 1, // Will be updated by PDF renderer
          data: arrayBuffer,
        };

        onDocumentLoad(document);
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to load document");
      } finally {
        setIsUploading(false);
      }
    },
    [onDocumentLoad, onError, validateFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile],
  );

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-primary to-secondary"
          >
            <Upload className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Redact with Privacy
          </h2>
          <p className="text-default-500 text-base sm:text-lg">
            Upload a document to automatically detect and redact sensitive information
          </p>
        </div>

        {/* Upload Area */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-300
            ${isDragging ? "border-primary bg-primary/10 scale-105" : "border-default-300 bg-content1/50"}
            ${isUploading ? "opacity-50 pointer-events-none" : "hover:border-primary/50 hover:bg-content1/80"}
            backdrop-blur-md shadow-xl
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          aria-label="Upload document by dragging and dropping or clicking to browse"
          tabIndex={0}
        >
          {/* Animated background gradient */}
          <motion.div
            animate={{
              opacity: isDragging ? 0.3 : 0,
              scale: isDragging ? 1 : 0.8,
            }}
            className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl"
          />

          <div className="relative flex flex-col items-center gap-6">
            {/* Icon with animation */}
            <AnimatePresence mode="wait">
              {isUploading ? (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <Upload className="w-10 h-10 text-primary" />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-20 h-20 rounded-full bg-default-100 flex items-center justify-center"
                >
                  <Upload className="w-10 h-10 text-default-400" />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <p className="text-xl sm:text-2xl font-bold mb-2">
                {isUploading ? "Uploading..." : isDragging ? "Drop it here!" : "Drop your document here"}
              </p>
              <p className="text-sm sm:text-base text-default-500 mb-6">
                or click to browse files
              </p>
            </div>

            <input
              type="file"
              id="file-input"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileInput}
              disabled={isUploading}
              aria-label="Upload document file"
            />

            <Button
              as="label"
              htmlFor="file-input"
              color="primary"
              size="lg"
              isDisabled={isUploading}
              isLoading={isUploading}
              className="px-8 h-12 text-base font-semibold shadow-lg"
            >
              {isUploading ? "Loading..." : "Select File"}
            </Button>
          </div>
        </motion.div>

        {/* Supported Formats */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-content2/80 backdrop-blur-sm"
          >
            <FileText className="w-5 h-5 text-danger-500" />
            <span className="text-sm font-medium">PDF</span>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-content2/80 backdrop-blur-sm"
          >
            <ImageIcon className="w-5 h-5 text-success-500" />
            <span className="text-sm font-medium">PNG / JPG</span>
          </motion.div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-content2/80 backdrop-blur-sm">
            <span className="text-sm font-medium text-default-500">Max 50MB</span>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "🔒", title: "100% Private", desc: "All processing happens locally" },
            { icon: "⚡", title: "Fast & Smart", desc: "AI-powered PII detection" },
            { icon: "✨", title: "Easy Export", desc: "Download as PDF or image" },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="text-center p-4 rounded-2xl bg-content1/30 backdrop-blur-sm"
            >
              <div className="text-3xl mb-2">{feature.icon}</div>
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-xs text-default-500">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

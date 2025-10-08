import { Button } from "@heroui/button";
import { useCallback, useState } from "react";
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
    <div className="w-full max-w-2xl mx-auto p-6">
      <div
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-colors
          ${isDragging ? "border-primary bg-primary/10" : "border-default-300"}
          ${isUploading ? "opacity-50 pointer-events-none" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        aria-label="Upload document by dragging and dropping or clicking to browse"
        tabIndex={0}
      >
        <div className="flex flex-col items-center gap-4">
          <svg
            className="w-16 h-16 text-default-400"
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

          <div>
            <p className="text-lg font-semibold mb-2">
              {isUploading ? "Uploading..." : "Drop your document here"}
            </p>
            <p className="text-sm text-default-500 mb-4">
              or click to browse files
            </p>
            <p className="text-xs text-default-400">
              Supports PDF, PNG, JPG, JPEG (max 50MB)
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
          >
            {isUploading ? "Loading..." : "Select File"}
          </Button>
        </div>
      </div>
    </div>
  );
};

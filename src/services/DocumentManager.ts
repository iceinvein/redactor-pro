import type {
  Document,
  DocumentType,
  DocumentManager as IDocumentManager,
  ValidationResult,
} from "../types/redaction";
import { DocumentType as DocType } from "../types/redaction";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
const SUPPORTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const SUPPORTED_PDF_TYPE = "application/pdf";

export class DocumentManager implements IDocumentManager {
  /**
   * Validates a document file for format and size constraints
   */
  validateDocument(file: File): ValidationResult {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
      };
    }

    // Check file type
    try {
      this.getDocumentType(file);
    } catch {
      return {
        isValid: false,
        error: `Unsupported file format. Please upload a PDF or image file (PNG, JPG, JPEG).`,
      };
    }

    return { isValid: true };
  }

  /**
   * Determines the document type based on file MIME type
   */
  getDocumentType(file: File): DocumentType {
    if (file.type === SUPPORTED_PDF_TYPE) {
      return DocType.PDF;
    }

    if (SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return DocType.IMAGE;
    }

    // Fallback: check file extension if MIME type is not reliable
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension === "pdf") {
      return DocType.PDF;
    }
    if (["png", "jpg", "jpeg"].includes(extension || "")) {
      return DocType.IMAGE;
    }

    throw new Error("Unsupported file format");
  }

  /**
   * Loads a document file and creates a Document model
   */
  async loadDocument(file: File): Promise<Document> {
    // Validate the document first
    const validation = this.validateDocument(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const documentType = this.getDocumentType(file);

    // Read file data
    const data = await this.readFileData(file, documentType);

    // Create Document model
    const document: Document = {
      id: this.generateDocumentId(),
      type: documentType,
      name: file.name,
      pageCount: documentType === DocType.PDF ? 0 : 1, // PDF page count will be determined by PDFRenderer
      data,
    };

    return document;
  }

  /**
   * Reads file data as ArrayBuffer for PDFs or base64 string for images
   */
  private async readFileData(
    file: File,
    type: DocumentType,
  ): Promise<ArrayBuffer | string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (type === DocType.PDF) {
          // PDFs need ArrayBuffer for PDF.js
          resolve(reader.result as ArrayBuffer);
        } else {
          // Images can use data URL string
          resolve(reader.result as string);
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      if (type === DocType.PDF) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  }

  /**
   * Generates a unique document ID
   */
  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

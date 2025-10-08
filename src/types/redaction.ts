// Core Enums

export enum DocumentType {
  PDF = "pdf",
  IMAGE = "image",
}

export enum PIIType {
  NAME = "name",
  EMAIL = "email",
  PHONE = "phone",
  SSN = "ssn",
  ADDRESS = "address",
  DATE_OF_BIRTH = "date_of_birth",
  CREDIT_CARD = "credit_card",
  OTHER = "other",
}

export enum ErrorType {
  INVALID_FILE_FORMAT = "INVALID_FILE_FORMAT",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  OCR_FAILED = "OCR_FAILED",
  MODEL_LOAD_FAILED = "MODEL_LOAD_FAILED",
  PII_DETECTION_FAILED = "PII_DETECTION_FAILED",
  EXPORT_FAILED = "EXPORT_FAILED",
  CANVAS_ERROR = "CANVAS_ERROR",
}

export enum InteractionMode {
  VIEW = "view",
  MANUAL_REDACT = "manual-redact",
  REVIEW = "review",
}

// Core Interfaces

export interface Document {
  id: string;
  type: DocumentType;
  name: string;
  pageCount: number;
  data: ArrayBuffer | string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface RedactionRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  piiType?: PIIType;
  confidence?: number;
  isManual: boolean;
}

export interface PageDimensions {
  width: number;
  height: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OCRWord {
  text: string;
  bbox: BoundingBox;
  confidence: number;
}

export interface OCRResult {
  text: string;
  words: OCRWord[];
  confidence: number;
}

export interface PIIDetection {
  text: string;
  type: PIIType;
  confidence: number;
  startIndex: number;
  endIndex: number;
  words: OCRWord[];
}

export interface AppError {
  type: ErrorType;
  message: string;
  recoverable: boolean;
  suggestedAction?: string;
}

export interface ProcessingStatus {
  stage: "loading" | "ocr" | "pii-detection" | "complete" | "error";
  progress: number;
  message: string;
}

export interface AppState {
  document: Document | null;
  currentPage: number;
  zoom: number;
  redactions: Map<number, RedactionRegion[]>; // page number -> regions
  isProcessing: boolean;
  processingStatus: ProcessingStatus;
  mode: InteractionMode;
}

export interface ModelCache {
  ocrWorker: Worker | null;
  piiModel: ort.InferenceSession | null;
  isInitialized: boolean;
}

// Service Interfaces

export interface DocumentManager {
  loadDocument(file: File): Promise<Document>;
  getDocumentType(file: File): DocumentType;
  validateDocument(file: File): ValidationResult;
}

export interface CanvasController {
  initialize(canvasElement: HTMLCanvasElement): void;
  renderPage(pageNumber: number): Promise<void>;
  addRedactionRegion(region: RedactionRegion): void;
  removeRedactionRegion(regionId: string): void;
  highlightRegion(regionId: string): void;
  clearHighlight(): void;
  getCanvasCoordinates(x: number, y: number): Point;
  setZoom(scale: number): void;
  getHighlightedRegionId(): string | null;
  getRegions(): RedactionRegion[];
}

export interface PDFRenderer {
  loadPDF(data: ArrayBuffer): Promise<void>;
  getPageCount(): number;
  renderPage(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number,
  ): Promise<void>;
  getPageDimensions(pageNumber: number): Promise<PageDimensions>;
  extractPageAsImage(pageNumber: number): Promise<ImageData>;
}

export interface ImageRenderer {
  loadImage(file: File): Promise<void>;
  renderImage(canvas: HTMLCanvasElement, scale: number): Promise<void>;
  getImageDimensions(): ImageDimensions;
  getImageData(): ImageData;
}

export interface OCREngine {
  initialize(): Promise<void>;
  extractText(imageData: ImageData): Promise<OCRResult>;
  terminate(): void;
}

export interface PIIDetectionEngine {
  initialize(modelPath: string): Promise<void>;
  detectPII(text: string, words: OCRWord[]): Promise<PIIDetection[]>;
  dispose(): Promise<void>;
}

export interface RedactionManager {
  addAutoDetectedRegions(detections: PIIDetection[]): void;
  addManualRegion(region: RedactionRegion): void;
  removeRegion(regionId: string): void;
  getRegions(): RedactionRegion[];
  getRegionsByType(type: PIIType): RedactionRegion[];
  clearAllRegions(): void;
  applyRedactions(canvas: HTMLCanvasElement): void;
}

export interface ExportService {
  exportAsPDF(pages: HTMLCanvasElement[], originalName: string): Promise<void>;
  exportAsImage(
    canvas: HTMLCanvasElement,
    originalName: string,
    format: "png" | "jpg",
  ): Promise<void>;
}

import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { useCallback, useEffect, useRef, useState } from "react";
import { BottomDock } from "@/components/BottomDock";
import { CanvasViewer } from "@/components/CanvasViewer";
import { DocumentUpload } from "@/components/DocumentUpload";
import { LeftRail } from "@/components/LeftRail";
import { MobileToolbar } from "@/components/MobileToolbar";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { RightPanel } from "@/components/RightPanel";
import {
  useDocument,
  useErrors,
  useHistory,
  useProcessing,
  useRedactions,
} from "@/hooks";
import {
  CanvasController,
  ExportService,
  ImageRenderer,
  OCREngineWorker,
  PDFRenderer,
  PIIDetectionEngineImpl,
  RedactionManager,
} from "@/services";
import {
  type Document,
  DocumentType,
  HistoryActionType,
  InteractionMode,
  type PIIDetection,
  PIIType,
} from "@/types/redaction";
import { downloadCanvasAsScreenshot } from "@/utils/screenshot";

export default function IndexPage() {
  // Hooks
  const { document, currentPage, loadDocument, clearDocument, goToPage } =
    useDocument();

  const {
    addAutoDetectedRegions,
    removeRegion,
    getRegionsForPage,
    clearAllRegions,
    selectRegion,
  } = useRedactions();

  const {
    isProcessing,
    processingStatus,
    startProcessing,
    updateProgress,
    updateStage,
    completeProcessing,
    errorProcessing,
  } = useProcessing();

  const {
    handleFileError,
    handleOCRError,
    handlePIIDetectionError,
    handleExportError,
    handleCanvasError,
  } = useErrors();

  const { history, addEntry, clearHistory } = useHistory();

  // Local state
  const [mode, setMode] = useState<InteractionMode>(InteractionMode.VIEW);
  const [piiDetections, setPiiDetections] = useState<PIIDetection[]>([]);
  const [enabledDetections, setEnabledDetections] = useState<Set<string>>(
    new Set(),
  );
  const [manualOnlyMode, setManualOnlyMode] = useState(false);
  const [_renderTrigger, setRenderTrigger] = useState(0);
  const [exportFormat, setExportFormat] = useState<"pdf" | "png">("pdf");
  const [hasRunDetection, setHasRunDetection] = useState(false);

  // Mobile modal control using HeroUI's useDisclosure hook (right panel only)
  const {
    isOpen: isRightModalOpen,
    onOpen: onOpenRightModal,
    onClose: onCloseRightModal,
  } = useDisclosure();

  // Force canvas re-render when modal closes (fixes blank canvas issue)
  useEffect(() => {
    if (!isRightModalOpen && document && !isRenderingRef.current) {
      // Small delay to prevent race condition with ongoing render
      const timer = setTimeout(() => {
        setRenderTrigger((prev) => prev + 1);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isRightModalOpen, document]);

  // Service instances (refs to persist across renders)
  const pdfRendererRef = useRef<PDFRenderer>(new PDFRenderer());
  const imageRendererRef = useRef<ImageRenderer>(new ImageRenderer());
  const canvasControllerRef = useRef<CanvasController | null>(null);
  const ocrEngineRef = useRef<OCREngineWorker | null>(null);
  const piiEngineRef = useRef<PIIDetectionEngineImpl | null>(null);
  const redactionManagerRef = useRef<RedactionManager>(new RedactionManager());
  const exportServiceRef = useRef<ExportService>(new ExportService());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isRenderingRef = useRef(false);

  // Initialize service instances (lazy loading - services initialize on first use)
  useEffect(() => {
    // Create service instances without initializing them
    // They will initialize lazily when first used
    ocrEngineRef.current = new OCREngineWorker();
    piiEngineRef.current = new PIIDetectionEngineImpl();

    // Cleanup on unmount - dispose all resources
    return () => {
      // Terminate OCR worker
      if (ocrEngineRef.current) {
        ocrEngineRef.current.terminate();
        ocrEngineRef.current = null;
      }

      // Dispose PII detection engine (releases ONNX session)
      if (piiEngineRef.current) {
        piiEngineRef.current.dispose();
        piiEngineRef.current = null;
      }

      // Destroy canvas controller and clear buffers
      if (canvasControllerRef.current) {
        canvasControllerRef.current.destroy();
        canvasControllerRef.current = null;
      }

      // Clear canvas reference
      canvasRef.current = null;
    };
  }, []);

  // Handle mode changes - enable/disable manual drawing
  useEffect(() => {
    if (!canvasControllerRef.current) return;

    if (mode === InteractionMode.MANUAL_REDACT) {
      // Enable manual drawing mode
      canvasControllerRef.current.enableManualDrawing((region) => {
        // Add the manually drawn region to the redaction manager
        addAutoDetectedRegions(currentPage, [
          {
            text: "Manual Redaction",
            type: PIIType.OTHER,
            confidence: 100,
            startIndex: 0,
            endIndex: 0,
            words: [
              {
                text: "",
                bbox: {
                  x0: region.x,
                  y0: region.y,
                  x1: region.x + region.width,
                  y1: region.y + region.height,
                },
                confidence: 100,
              },
            ],
          },
        ]);

        // Track history
        addEntry(
          HistoryActionType.MANUAL_REDACTION_ADDED,
          "Added manual redaction",
          { page: currentPage },
        );
      });
    } else {
      // Disable manual drawing mode
      canvasControllerRef.current.disableManualDrawing();
    }
  }, [mode, currentPage, addAutoDetectedRegions, addEntry]);

  // Handle document upload
  const handleDocumentLoad = useCallback(
    async (doc: Document) => {
      startProcessing("loading", "Loading document...");

      try {
        // Clean up previous document resources
        if (canvasControllerRef.current) {
          canvasControllerRef.current.clearPageCache();
        }

        // Load document into appropriate renderer
        if (doc.type === DocumentType.PDF) {
          await pdfRendererRef.current.loadPDF(doc.data as ArrayBuffer);
          const pageCount = pdfRendererRef.current.getPageCount();
          doc.pageCount = pageCount;
        } else {
          // For images, data is already a data URL string
          await imageRendererRef.current.loadImageFromDataURL(
            doc.data as string,
          );
        }

        loadDocument(doc);
        setMode(InteractionMode.VIEW);
        clearAllRegions();
        setPiiDetections([]);
        setEnabledDetections(new Set());
        setManualOnlyMode(false);
        setHasRunDetection(false);

        // Track history
        addEntry(HistoryActionType.DOCUMENT_UPLOADED, `Uploaded ${doc.name}`, {
          count: doc.pageCount,
        });

        // Force a render trigger to ensure canvas updates
        setRenderTrigger((prev) => prev + 1);

        completeProcessing("Document loaded successfully");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load document";
        errorProcessing(message);
        handleFileError(message);
      }
    },
    [
      loadDocument,
      clearAllRegions,
      addEntry,
      startProcessing,
      completeProcessing,
      errorProcessing,
      handleFileError,
    ],
  );

  // Handle upload new document
  const handleUploadNew = useCallback(() => {
    // Reset everything
    clearDocument();
    clearAllRegions();
    setPiiDetections([]);
    setEnabledDetections(new Set());
    setMode(InteractionMode.VIEW);
    setManualOnlyMode(false);
    setHasRunDetection(false);
    clearHistory();

    // Clear canvas
    if (canvasControllerRef.current) {
      canvasControllerRef.current.clearPageCache();
    }
  }, [clearDocument, clearAllRegions, clearHistory]);

  // Handle canvas ready
  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;

    // Don't create a new controller if one already exists
    if (!canvasControllerRef.current) {
      canvasControllerRef.current = new CanvasController();
      canvasControllerRef.current.initialize(canvas);
    }
  }, []);

  // Render current page
  useEffect(() => {
    const renderPage = async () => {
      if (!document || !canvasControllerRef.current || !canvasRef.current)
        return;

      // Prevent concurrent renders
      if (isRenderingRef.current) {
        return;
      }

      isRenderingRef.current = true;

      try {
        // Ensure canvas is visible and has proper dimensions before rendering
        if (canvasRef.current.width === 0 || canvasRef.current.height === 0) {
          // Canvas not ready yet, skip this render
          isRenderingRef.current = false;
          return;
        }

        // Render the actual document content first
        if (document.type === DocumentType.PDF) {
          await pdfRendererRef.current.renderPage(
            currentPage,
            canvasRef.current,
            1.0,
          );
        } else {
          await imageRendererRef.current.renderImage(canvasRef.current, 1.0);
        }

        // Update redaction regions for current page
        const regions = getRegionsForPage(currentPage);

        // Update redaction manager and apply solid black redactions
        redactionManagerRef.current.clearAllRegions();
        regions.forEach((region) => {
          redactionManagerRef.current.addManualRegion(region);
        });

        // Always apply solid black redactions
        if (regions.length > 0) {
          redactionManagerRef.current.applyRedactions(canvasRef.current);
        }

        // Cache the rendered page for quick navigation
        canvasControllerRef.current.cachePage(currentPage);

        // Clear distant pages to free up memory
        if (document.pageCount > 10) {
          canvasControllerRef.current.clearDistantPages(currentPage);
        }
      } catch (err) {
        console.error("Failed to render page:", err);
        const message =
          err instanceof Error ? err.message : "Failed to render page";
        handleCanvasError(message);
      } finally {
        isRenderingRef.current = false;
      }
    };

    renderPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, currentPage, getRegionsForPage, handleCanvasError]);

  // Handle PII detection
  const handleDetectPII = useCallback(async () => {
    if (
      !document ||
      !canvasRef.current ||
      !ocrEngineRef.current ||
      !piiEngineRef.current
    ) {
      return;
    }

    startProcessing("loading", "Initializing OCR engine...");

    try {
      // Get image data from canvas
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");

      const imageData = ctx.getImageData(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      );

      // Set up progress callback for OCR initialization
      ocrEngineRef.current.setProgressCallback((progress, status) => {
        updateProgress(progress * 0.3, status); // OCR init takes 30% of progress
      });

      // Perform OCR (will initialize lazily if needed)
      updateStage("ocr", "Extracting text from document...");
      const ocrResult = await ocrEngineRef.current.extractText(imageData);
      updateProgress(50, "OCR complete, initializing PII detection...");

      // Detect PII (will initialize lazily if needed)
      updateStage("pii-detection", "Analyzing text for PII...");
      const detections = await piiEngineRef.current.detectPII(
        ocrResult.text,
        ocrResult.words,
      );

      updateProgress(90, "Processing detections...");

      // Store detections
      setPiiDetections(detections);

      // Enable all detections by default
      const detectionIds = new Set(
        detections.map((d, i) => `${d.type}-${d.startIndex}-${i}`),
      );
      setEnabledDetections(detectionIds);

      // Add redaction regions
      addAutoDetectedRegions(currentPage, detections);

      // Track history
      addEntry(
        HistoryActionType.PII_DETECTION_RUN,
        `Detected ${detections.length} PII item${detections.length !== 1 ? "s" : ""}`,
        { page: currentPage, count: detections.length },
      );

      completeProcessing(`Found ${detections.length} PII items`);
      setMode(InteractionMode.REVIEW);
      setHasRunDetection(true);

      // Optional: Clean up resources after detection is complete
      // Note: We keep the engines alive for potential re-detection on other pages
      // They will be cleaned up on component unmount
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to detect PII";
      errorProcessing(message);

      // Check if it's an OCR error or PII detection error
      if (
        message.toLowerCase().includes("ocr") ||
        message.toLowerCase().includes("text extraction")
      ) {
        handleOCRError(message);
        setManualOnlyMode(true);
        setMode(InteractionMode.MANUAL_REDACT);
      } else {
        handlePIIDetectionError(message);
      }
    }
  }, [
    document,
    currentPage,
    addAutoDetectedRegions,
    addEntry,
    startProcessing,
    updateProgress,
    updateStage,
    completeProcessing,
    errorProcessing,
    handleOCRError,
    handlePIIDetectionError,
  ]);

  // Handle export
  const handleExport = useCallback(
    async (format: "pdf" | "png" = exportFormat) => {
      if (!document || !canvasRef.current) return;

      startProcessing("loading", "Preparing export...");

      try {
        // Apply redactions to canvas
        const regions = getRegionsForPage(currentPage);
        redactionManagerRef.current.clearAllRegions();
        regions.forEach((region) => {
          redactionManagerRef.current.addManualRegion(region);
        });

        if (canvasControllerRef.current) {
          await canvasControllerRef.current.renderPage(currentPage);
        }

        redactionManagerRef.current.applyRedactions(canvasRef.current);

        updateProgress(50, "Generating export file...");

        // Export based on format
        if (format === "pdf") {
          const pages = [canvasRef.current];
          await exportServiceRef.current.exportAsPDF(pages, document.name);
        } else {
          await exportServiceRef.current.exportAsImage(
            canvasRef.current,
            document.name,
            format,
          );
        }

        // Track history
        addEntry(
          HistoryActionType.EXPORT_COMPLETED,
          `Exported as ${format.toUpperCase()}`,
          { format, count: regions.length },
        );

        completeProcessing("Export complete");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to export";
        errorProcessing(message);
        handleExportError(message);

        // Try screenshot fallback
        try {
          if (canvasRef.current) {
            await downloadCanvasAsScreenshot(canvasRef.current, document.name);
            completeProcessing("Exported as screenshot (fallback)");
          }
        } catch (screenshotErr) {
          console.error("Screenshot fallback also failed:", screenshotErr);
        }
      }
    },
    [
      document,
      currentPage,
      getRegionsForPage,
      addEntry,
      startProcessing,
      updateProgress,
      completeProcessing,
      errorProcessing,
      handleExportError,
      exportFormat,
    ],
  );

  // Handle PII detection toggle
  const handleToggleDetection = useCallback(
    (detectionId: string, enabled: boolean) => {
      const detectionIndex = Number.parseInt(
        detectionId.split("-").pop() || "0",
        10,
      );
      const detection = piiDetections[detectionIndex];

      if (!detection) return;

      setEnabledDetections((prev) => {
        const newSet = new Set(prev);
        if (enabled) {
          newSet.add(detectionId);
        } else {
          newSet.delete(detectionId);
        }
        return newSet;
      });

      if (enabled) {
        // Add the detection back
        addAutoDetectedRegions(currentPage, [detection]);
        addEntry(
          HistoryActionType.DETECTION_TOGGLED,
          `Enabled ${detection.type} detection`,
          { page: currentPage, piiType: detection.type },
        );
      } else {
        // Remove all regions for this detection
        // Since we can't match by detection ID, we need to remove by position/type
        const regions = getRegionsForPage(currentPage);
        const bbox = detection.words[0]?.bbox;

        // Find and remove the region that matches this detection's position
        const matchingRegion = regions.find(
          (r) =>
            Math.abs(r.x - (bbox?.x0 || 0)) < 5 &&
            Math.abs(r.y - (bbox?.y0 || 0)) < 5 &&
            r.piiType === detection.type,
        );

        if (matchingRegion) {
          removeRegion(currentPage, matchingRegion.id);
          addEntry(
            HistoryActionType.DETECTION_TOGGLED,
            `Disabled ${detection.type} detection`,
            { page: currentPage, piiType: detection.type },
          );
        }
      }

      // Trigger re-render to update canvas
      setRenderTrigger((prev) => prev + 1);
    },
    [
      currentPage,
      removeRegion,
      piiDetections,
      addAutoDetectedRegions,
      getRegionsForPage,
      addEntry,
    ],
  );

  // Handle region highlight
  const handleHighlightDetection = useCallback(
    (detectionId: string | null) => {
      if (canvasControllerRef.current) {
        if (detectionId) {
          canvasControllerRef.current.highlightRegion(detectionId);
        } else {
          canvasControllerRef.current.clearHighlight();
        }
      }
      selectRegion(detectionId);
    },
    [selectRegion],
  );

  // Keyboard shortcuts (page navigation only, delete is handled by CanvasController)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case "ArrowLeft": {
          // Previous page
          if (document && currentPage > 1) {
            goToPage(currentPage - 1);
            event.preventDefault();
          }
          break;
        }

        case "ArrowRight": {
          // Next page
          if (document && currentPage < document.pageCount) {
            goToPage(currentPage + 1);
            event.preventDefault();
          }
          break;
        }

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [document, currentPage, goToPage]);

  return (
    <>
      {/* Mobile Right Panel Modal - Side Drawer */}

      <Modal
        isOpen={isRightModalOpen}
        onClose={onCloseRightModal}
        size="lg"
        placement="center"
        scrollBehavior="inside"
        className="lg:hidden"
        classNames={{
          base: "max-h-[80vh]",
          wrapper: "!items-center",
          body: "p-0 overflow-hidden flex-1",
          header: "border-b border-default-200 flex-shrink-0",
        }}
      >
        <ModalContent className="flex flex-col h-full">
          <ModalHeader>Panels</ModalHeader>
          <ModalBody className="flex-1 overflow-hidden">
            <RightPanel
              detections={piiDetections}
              enabledDetections={enabledDetections}
              onToggleDetection={handleToggleDetection}
              onHighlightDetection={handleHighlightDetection}
              getRegionsForPage={getRegionsForPage}
              currentPage={currentPage}
              onRemoveRegion={(page, id) => removeRegion(page, id)}
              history={history}
              onClearHistory={clearHistory}
              exportFormat={exportFormat}
              onChangeExportFormat={setExportFormat}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      <div className="h-full w-full flex flex-col overflow-hidden">
        {/* Processing Status Overlay */}
        {isProcessing && <ProcessingStatus status={processingStatus} />}

        {/* Main Content */}
        {!document ? (
          <div className="flex-1 flex items-center justify-center bg-default-50">
            <DocumentUpload
              onDocumentLoad={handleDocumentLoad}
              onError={(err) => handleFileError(err)}
            />
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden pb-14 sm:pb-16">
            {/* Responsive Grid: single column on mobile, 3-column on desktop */}
            <div className="flex-1 grid overflow-hidden grid-cols-1 lg:grid-cols-[240px_1fr_380px]">
              {/* Left rail - hidden on mobile, visible on desktop */}
              <div className="hidden lg:block">
                <LeftRail
                  mode={mode}
                  onModeChange={setMode}
                  onClearAll={() => {
                    const count = getRegionsForPage(currentPage).length;
                    clearAllRegions(currentPage);
                    setPiiDetections([]);
                    setEnabledDetections(new Set());
                    setHasRunDetection(false);
                    if (canvasControllerRef.current) {
                      canvasControllerRef.current.clearRegions();
                    }
                    addEntry(
                      HistoryActionType.PAGE_CLEARED,
                      `Cleared ${count} redaction${count !== 1 ? "s" : ""} from page ${currentPage}`,
                      { page: currentPage, count },
                    );
                    setRenderTrigger((prev) => prev + 1);
                  }}
                  onUploadNew={handleUploadNew}
                  isProcessing={isProcessing}
                  hasDocument={!!document}
                  manualOnlyMode={manualOnlyMode}
                />
              </div>

              {/* Canvas center - full width on mobile */}
              <div className="overflow-hidden flex flex-col">
                {/* Mobile expandable toolbar */}
                {document && (
                  <MobileToolbar
                    mode={mode}
                    onModeChange={setMode}
                    onClearAll={() => {
                      const count = getRegionsForPage(currentPage).length;
                      clearAllRegions(currentPage);
                      setPiiDetections([]);
                      setEnabledDetections(new Set());
                      setHasRunDetection(false);
                      if (canvasControllerRef.current) {
                        canvasControllerRef.current.clearRegions();
                      }
                      addEntry(
                        HistoryActionType.PAGE_CLEARED,
                        `Cleared ${count} redaction${count !== 1 ? "s" : ""} from page ${currentPage}`,
                        { page: currentPage, count },
                      );
                      setRenderTrigger((prev) => prev + 1);
                    }}
                    onUploadNew={handleUploadNew}
                    isProcessing={isProcessing}
                    hasDocument={!!document}
                    manualOnlyMode={manualOnlyMode}
                  />
                )}

                <div className="flex-1 flex flex-col">
                  <CanvasViewer
                    canvasController={canvasControllerRef.current}
                    onCanvasReady={handleCanvasReady}
                    onOpenRightPanel={onOpenRightModal}
                    showMobileRightButton={!!document}
                  />
                </div>
                {/* Page Navigator at bottom of canvas */}
                {document && document.pageCount > 1 && (
                  <div className="border-t border-default-200 bg-default-50/80 dark:bg-default-100/80 p-2 sm:p-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => goToPage(currentPage - 1)}
                        isDisabled={currentPage <= 1}
                        aria-label="Previous page"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </Button>
                      <div
                        className="text-xs sm:text-sm font-medium"
                        aria-live="polite"
                      >
                        Page {currentPage} of {document.pageCount}
                      </div>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => goToPage(currentPage + 1)}
                        isDisabled={currentPage >= document.pageCount}
                        aria-label="Next page"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right panel tabs - hidden on mobile, visible on desktop */}
              <div className="hidden lg:block">
                <RightPanel
                  detections={piiDetections}
                  enabledDetections={enabledDetections}
                  onToggleDetection={handleToggleDetection}
                  onHighlightDetection={handleHighlightDetection}
                  getRegionsForPage={getRegionsForPage}
                  currentPage={currentPage}
                  onRemoveRegion={(page, id) => removeRegion(page, id)}
                  history={history}
                  onClearHistory={clearHistory}
                  exportFormat={exportFormat}
                  onChangeExportFormat={setExportFormat}
                />
              </div>
            </div>
          </div>
        )}

        {/* Fixed bottom action bar */}
        {document && (
          <BottomDock
            hasDocument={!!document}
            isProcessing={isProcessing}
            statusText={processingStatus.message}
            onDetectPII={handleDetectPII}
            onExport={() => handleExport()}
            hasRedactions={getRegionsForPage(currentPage).length > 0}
            hasRunDetection={hasRunDetection}
          />
        )}
      </div>
    </>
  );
}

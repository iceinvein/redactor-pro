import { Button } from "@heroui/button";
import { motion } from "framer-motion";
import { Maximize2, Settings, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasController } from "@/services/CanvasController";

interface CanvasViewerProps {
  canvasController: CanvasController | null;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  // Mobile right panel control
  onOpenRightPanel?: () => void;
  showMobileRightButton?: boolean;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

export const CanvasViewer = ({
  canvasController,
  onCanvasReady,
  onOpenRightPanel,
  showMobileRightButton = false,
}: CanvasViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current && !canvasController) {
      // Only notify parent that canvas is ready
      // Don't initialize controller here - let parent handle it
      onCanvasReady?.(canvasRef.current);
    }
  }, [onCanvasReady, canvasController]);

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Apply zoom to canvas controller
  useEffect(() => {
    if (canvasController) {
      canvasController.setZoom(zoom);
    }
  }, [zoom, canvasController]);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((prev) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
    }
  }, []);

  // Handle panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0 && (e.ctrlKey || e.metaKey || e.shiftKey)) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        e.preventDefault();
      }
    },
    [panOffset],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPanOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    },
    [isPanning, panStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  return (
    <div className="flex flex-col min-h-full relative">
      {/* Floating Zoom Controls - Modern Design */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-content1/80 backdrop-blur-2xl rounded-2xl p-2 shadow-xl border border-divider/50"
        role="toolbar"
        aria-label="Canvas controls"
      >
        <Button
          size="sm"
          variant="light"
          isIconOnly
          onPress={handleZoomOut}
          isDisabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          className="rounded-xl"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>

        <motion.output
          whileHover={{ scale: 1.05 }}
          className="text-sm font-bold min-w-[60px] text-center px-2 py-1 rounded-lg bg-primary/10 text-primary"
          aria-live="polite"
          aria-label={`Current zoom level: ${Math.round(zoom * 100)} percent`}
        >
          {Math.round(zoom * 100)}%
        </motion.output>

        <Button
          size="sm"
          variant="light"
          isIconOnly
          onPress={handleZoomIn}
          isDisabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          className="rounded-xl"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-divider mx-1" />

        <Button
          size="sm"
          variant="light"
          isIconOnly
          onPress={handleZoomReset}
          aria-label="Reset zoom to 100%"
          className="rounded-xl"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>

        {/* Mobile right panel button */}
        {showMobileRightButton && onOpenRightPanel && (
          <>
            <div className="w-px h-6 bg-divider mx-1 lg:hidden" />
            <Button
              size="sm"
              variant="light"
              isIconOnly
              onPress={onOpenRightPanel}
              aria-label="Open panels"
              className="lg:hidden rounded-xl"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </>
        )}
      </motion.div>

      {/* Help text - floating on desktop */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="hidden lg:block absolute top-4 right-4 z-30 text-xs text-default-600 bg-content1/60 backdrop-blur-xl rounded-xl px-3 py-2 shadow-lg border border-divider/50"
        role="note"
      >
        <span className="font-medium">Tip:</span> Ctrl/Cmd + Scroll to zoom,
        Shift + Drag to pan
      </motion.div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-auto bg-gradient-to-br from-default-50 to-default-100 relative canvas-container pb-20 sm:pb-24 isolate ${isPanning ? "panning cursor-grabbing" : "cursor-default"}`}
        style={{ contain: "paint" }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        role="application"
        aria-label="Document canvas viewer"
      >
        <div
          className={`canvas-wrapper flex items-center justify-center min-h-full p-8 ${isPanning ? "no-transition" : "transition-transform duration-200"}`}
          style={{
            transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0)`,
            willChange: "transform",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <canvas
              ref={canvasRef}
              className="shadow-2xl bg-white rounded-2xl"
              style={{
                transform: `scale(${zoom}) translateZ(0)`,
                willChange: "transform",
              }}
              role="img"
              aria-label="Document preview with redaction regions"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

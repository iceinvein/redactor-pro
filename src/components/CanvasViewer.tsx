import { Button } from "@heroui/button";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasController } from "@/services/CanvasController";

interface CanvasViewerProps {
  canvasController: CanvasController | null;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

export const CanvasViewer = ({
  canvasController,
  onCanvasReady,
}: CanvasViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      // Only initialize if we have a controller passed in
      if (canvasController) {
        canvasController.initialize(canvasRef.current);
      }
      // Always notify parent that canvas is ready
      onCanvasReady?.(canvasRef.current);
    }
  }, [canvasController, onCanvasReady]);

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
    <div className="flex flex-col h-full">
      {/* Zoom Controls */}
      <div
        className="flex items-center gap-2 p-4 border-b border-default-200"
        role="toolbar"
        aria-label="Canvas zoom controls"
      >
        <Button
          size="sm"
          variant="flat"
          onPress={handleZoomOut}
          isDisabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
            />
          </svg>
        </Button>

        <output
          className="text-sm font-medium min-w-[60px] text-center"
          aria-live="polite"
          aria-label={`Current zoom level: ${Math.round(zoom * 100)} percent`}
        >
          {Math.round(zoom * 100)}%
        </output>

        <Button
          size="sm"
          variant="flat"
          onPress={handleZoomIn}
          isDisabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            />
          </svg>
        </Button>

        <Button
          size="sm"
          variant="flat"
          onPress={handleZoomReset}
          aria-label="Reset zoom to 100%"
        >
          Reset
        </Button>

        <div className="ml-4 text-xs text-default-600" role="note">
          Tip: Ctrl/Cmd + Scroll to zoom, Shift + Drag to pan
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-auto bg-default-100 relative canvas-container ${isPanning ? "panning" : ""}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        role="application"
        aria-label="Document canvas viewer"
      >
        <div
          className={`canvas-wrapper ${isPanning ? "no-transition" : ""}`}
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          }}
        >
          <canvas
            ref={canvasRef}
            className="shadow-lg bg-white"
            style={{
              transform: `scale(${zoom})`,
            }}
            role="img"
            aria-label="Document preview with redaction regions"
          />
        </div>
      </div>
    </div>
  );
};

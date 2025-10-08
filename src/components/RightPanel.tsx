import { Button, ButtonGroup } from "@heroui/button";
import { useMemo, useState } from "react";
import { PIIListPanel } from "@/components/PIIListPanel";
import type { PIIDetection, RedactionRegion } from "@/types/redaction";

interface RightPanelProps {
  detections: PIIDetection[];
  enabledDetections: Set<string>;
  onToggleDetection: (detectionId: string, enabled: boolean) => void;
  onHighlightDetection: (detectionId: string | null) => void;
  getRegionsForPage: (page: number) => RedactionRegion[];
  currentPage: number;
  onRemoveRegion: (page: number, regionId: string) => void;
  // Settings
  exportFormat: "pdf" | "png";
  onChangeExportFormat: (fmt: "pdf" | "png") => void;
}

export const RightPanel = ({
  detections,
  enabledDetections,
  onToggleDetection,
  onHighlightDetection,
  getRegionsForPage,
  currentPage,
  onRemoveRegion,
  exportFormat,
  onChangeExportFormat,
}: RightPanelProps) => {
  const [tab, setTab] = useState<
    "detections" | "layers" | "history" | "settings"
  >("detections");

  const regions = useMemo(
    () => getRegionsForPage(currentPage),
    [getRegionsForPage, currentPage],
  );

  return (
    <aside className="border-l border-default-200 bg-default-50/70 backdrop-blur supports-[backdrop-filter]:bg-default-50/50 flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="p-3 border-b border-default-200/60">
        <ButtonGroup size="sm">
          <Button
            variant={tab === "detections" ? "solid" : "flat"}
            color={tab === "detections" ? "primary" : "default"}
            onPress={() => setTab("detections")}
          >
            Detections
          </Button>
          <Button
            variant={tab === "layers" ? "solid" : "flat"}
            color={tab === "layers" ? "primary" : "default"}
            onPress={() => setTab("layers")}
          >
            Layers
          </Button>
          <Button
            variant={tab === "history" ? "solid" : "flat"}
            color={tab === "history" ? "primary" : "default"}
            onPress={() => setTab("history")}
          >
            History
          </Button>
          <Button
            variant={tab === "settings" ? "solid" : "flat"}
            color={tab === "settings" ? "primary" : "default"}
            onPress={() => setTab("settings")}
          >
            Settings
          </Button>
        </ButtonGroup>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {tab === "detections" && (
          <PIIListPanel
            detections={detections}
            enabledDetections={enabledDetections}
            onToggleDetection={onToggleDetection}
            onHighlightDetection={onHighlightDetection}
          />
        )}

        {tab === "layers" && (
          <section aria-label="Layers panel" className="p-3">
            <header className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                Layers (Page {currentPage})
              </h3>
              <span className="text-xs text-default-500">
                {regions.length} region{regions.length === 1 ? "" : "s"}
              </span>
            </header>
            {regions.length === 0 ? (
              <p className="text-sm text-default-500">No regions yet.</p>
            ) : (
              <ul className="space-y-2">
                {regions.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between rounded-md border border-default-200 bg-white/60 dark:bg-default-100/60 p-2"
                  >
                    <div className="text-xs">
                      <div className="font-mono text-default-800 dark:text-default-200">
                        {r.piiType ?? "manual"}
                      </div>
                      <div className="text-default-500">
                        x:{Math.round(r.x)} y:{Math.round(r.y)} w:
                        {Math.round(r.width)} h:{Math.round(r.height)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="flat"
                      color="danger"
                      onPress={() => onRemoveRegion(currentPage, r.id)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === "history" && (
          <section aria-label="History panel" className="p-3">
            <h3 className="text-sm font-semibold mb-2">History</h3>
            <p className="text-sm text-default-500">No history yet.</p>
          </section>
        )}

        {tab === "settings" && (
          <section aria-label="Settings panel" className="p-3 space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Export Format</h3>
              <ButtonGroup size="sm">
                <Button
                  variant={exportFormat === "pdf" ? "solid" : "flat"}
                  color={exportFormat === "pdf" ? "primary" : "default"}
                  onPress={() => onChangeExportFormat("pdf")}
                >
                  PDF
                </Button>
                <Button
                  variant={exportFormat === "png" ? "solid" : "flat"}
                  color={exportFormat === "png" ? "primary" : "default"}
                  onPress={() => onChangeExportFormat("png")}
                >
                  PNG
                </Button>
              </ButtonGroup>
            </div>
          </section>
        )}
      </div>
    </aside>
  );
};

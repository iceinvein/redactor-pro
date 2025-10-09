import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Tab, Tabs } from "@heroui/tabs";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, History, Layers, Settings as SettingsIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { HistoryPanel } from "@/components/HistoryPanel";
import { PIIListPanel } from "@/components/PIIListPanel";
import type {
  HistoryEntry,
  PIIDetection,
  RedactionRegion,
} from "@/types/redaction";

interface RightPanelProps {
  detections: PIIDetection[];
  enabledDetections: Set<string>;
  onToggleDetection: (detectionId: string, enabled: boolean) => void;
  onHighlightDetection: (detectionId: string | null) => void;
  getRegionsForPage: (page: number) => RedactionRegion[];
  currentPage: number;
  onRemoveRegion: (page: number, regionId: string) => void;
  // History
  history: HistoryEntry[];
  onClearHistory: () => void;
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
  history,
  onClearHistory,
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
    <aside className="h-full border-l border-divider/50 bg-gradient-to-b from-content1/50 to-content1/80 backdrop-blur-xl flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="p-3 border-b border-divider/50">
        <Tabs
          selectedKey={tab}
          onSelectionChange={(key) => setTab(key as typeof tab)}
          variant="underlined"
          color="primary"
          size="sm"
          classNames={{
            tabList: "w-full gap-0",
            cursor: "bg-primary",
            tab: "px-1.5 min-w-0",
            tabContent: "group-data-[selected=true]:text-primary",
          }}
        >
          <Tab
            key="detections"
            title={
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Detections</span>
              </div>
            }
          />
          <Tab
            key="layers"
            title={
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Layers</span>
              </div>
            }
          />
          <Tab
            key="history"
            title={
              <div className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">History</span>
              </div>
            }
          />
          <Tab
            key="settings"
            title={
              <div className="flex items-center gap-1.5">
                <SettingsIcon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Settings</span>
              </div>
            }
          />
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {tab === "detections" && (
            <motion.div
              key="detections"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full px-4 py-4"
            >
              <PIIListPanel
                detections={detections}
                enabledDetections={enabledDetections}
                onToggleDetection={onToggleDetection}
                onHighlightDetection={onHighlightDetection}
              />
            </motion.div>
          )}

          {tab === "layers" && (
            <motion.section
              key="layers"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              aria-label="Layers panel"
              className="px-4 py-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Layers</h3>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-default-100 text-xs font-medium">
                  <span className="text-default-500">Page {currentPage}</span>
                  <div className="w-px h-3 bg-divider" />
                  <span className="text-primary">
                    {regions.length} region{regions.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              {regions.length === 0 ? (
                <EmptyState
                  icon="shield"
                  title="No redactions yet"
                  description="Draw manually or detect PII to add redaction regions"
                />
              ) : (
                <div className="space-y-3">
                  {regions.map((r, index) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onMouseEnter={() => onHighlightDetection(r.id)}
                      onMouseLeave={() => onHighlightDetection(null)}
                    >
                      <Card className="bg-content2/50 backdrop-blur-sm border border-divider/50 hover:border-primary/50 transition-colors cursor-pointer">
                        <CardBody className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-sm font-semibold text-foreground capitalize">
                                  {r.piiType ?? "manual"}
                                </span>
                              </div>
                              <div className="text-xs text-default-500 font-mono space-y-0.5">
                                <div>
                                  x: {Math.round(r.x)}, y: {Math.round(r.y)}
                                </div>
                                <div>
                                  w: {Math.round(r.width)}, h:{" "}
                                  {Math.round(r.height)}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="flat"
                              color="danger"
                              onPress={() => onRemoveRegion(currentPage, r.id)}
                              className="shrink-0"
                            >
                              Remove
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>
          )}

          {tab === "history" && (
            <motion.section
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              aria-label="History panel"
              className="px-4 py-4 h-full"
            >
              <HistoryPanel history={history} onClearHistory={onClearHistory} />
            </motion.section>
          )}

          {tab === "settings" && (
            <motion.section
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              aria-label="Settings panel"
              className="space-y-6 px-4 py-4"
            >
              <div>
                <h3 className="text-lg font-bold mb-4">Export Settings</h3>
                <Card className="bg-content2/50 backdrop-blur-sm border border-divider/50">
                  <CardBody className="p-4">
                    <label className="block text-sm font-semibold mb-3">
                      Export Format
                    </label>
                    <div className="flex gap-3">
                      <Button
                        size="lg"
                        variant={exportFormat === "pdf" ? "solid" : "flat"}
                        color={exportFormat === "pdf" ? "primary" : "default"}
                        onPress={() => onChangeExportFormat("pdf")}
                        className="flex-1 font-semibold"
                      >
                        PDF
                      </Button>
                      <Button
                        size="lg"
                        variant={exportFormat === "png" ? "solid" : "flat"}
                        color={exportFormat === "png" ? "primary" : "default"}
                        onPress={() => onChangeExportFormat("png")}
                        className="flex-1 font-semibold"
                      >
                        PNG
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
};

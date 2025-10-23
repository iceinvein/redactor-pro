import { useCallback, useState } from "react";
import type { PIIDetection, PIIType, RedactionRegion } from "@/types/redaction";

export function useRedactions() {
  const [redactions, setRedactions] = useState<Map<number, RedactionRegion[]>>(
    new Map(),
  );
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  const addAutoDetectedRegions = useCallback(
    (pageNumber: number, detections: PIIDetection[]) => {
      setRedactions((prev) => {
        const newMap = new Map(prev);
        const pageRegions = newMap.get(pageNumber) || [];

        const newRegions: RedactionRegion[] = [];

        detections.forEach((detection) => {
          // Group words by line based on their y-coordinates
          // Words on the same line should have similar y0 values
          const lines: (typeof detection.words)[] = [];
          let currentLine: typeof detection.words = [];
          let lastY0 = -1;

          detection.words.forEach((word) => {
            const y0 = word.bbox?.y0 || 0;

            // If this is the first word or it's on the same line (within 5px tolerance)
            if (lastY0 === -1 || Math.abs(y0 - lastY0) < 5) {
              currentLine.push(word);
              lastY0 = y0;
            } else {
              // New line detected
              if (currentLine.length > 0) {
                lines.push(currentLine);
              }
              currentLine = [word];
              lastY0 = y0;
            }
          });

          // Don't forget the last line
          if (currentLine.length > 0) {
            lines.push(currentLine);
          }

          // Create a redaction region for each line
          lines.forEach((lineWords) => {
            const firstWord = lineWords[0];
            const lastWord = lineWords[lineWords.length - 1];
            const bbox = firstWord?.bbox;
            const lastBbox = lastWord?.bbox;

            if (bbox && lastBbox) {
              newRegions.push({
                id: `auto-${Date.now()}-${Math.random()}`,
                x: bbox.x0,
                y: bbox.y0,
                width: lastBbox.x1 - bbox.x0,
                height: lastBbox.y1 - bbox.y0,
                piiType: detection.type,
                confidence: detection.confidence,
                isManual: false,
              });
            }
          });
        });

        newMap.set(pageNumber, [...pageRegions, ...newRegions]);
        return newMap;
      });
    },
    [],
  );

  const addManualRegion = useCallback(
    (pageNumber: number, region: Omit<RedactionRegion, "id" | "isManual">) => {
      setRedactions((prev) => {
        const newMap = new Map(prev);
        const pageRegions = newMap.get(pageNumber) || [];

        const newRegion: RedactionRegion = {
          ...region,
          id: `manual-${Date.now()}-${Math.random()}`,
          isManual: true,
        };

        newMap.set(pageNumber, [...pageRegions, newRegion]);
        return newMap;
      });
    },
    [],
  );

  const removeRegion = useCallback(
    (pageNumber: number, regionId: string) => {
      setRedactions((prev) => {
        const newMap = new Map(prev);
        const pageRegions = newMap.get(pageNumber) || [];
        const filtered = pageRegions.filter((r) => r.id !== regionId);

        if (filtered.length === 0) {
          newMap.delete(pageNumber);
        } else {
          newMap.set(pageNumber, filtered);
        }

        if (selectedRegionId === regionId) {
          setSelectedRegionId(null);
        }

        return newMap;
      });
    },
    [selectedRegionId],
  );

  const getRegionsForPage = useCallback(
    (pageNumber: number): RedactionRegion[] => {
      return redactions.get(pageNumber) || [];
    },
    [redactions],
  );

  const getRegionsByType = useCallback(
    (pageNumber: number, type: PIIType): RedactionRegion[] => {
      const pageRegions = redactions.get(pageNumber) || [];
      return pageRegions.filter((r) => r.piiType === type);
    },
    [redactions],
  );

  const clearAllRegions = useCallback((pageNumber?: number) => {
    if (pageNumber !== undefined) {
      setRedactions((prev) => {
        const newMap = new Map(prev);
        newMap.delete(pageNumber);
        return newMap;
      });
    } else {
      setRedactions(new Map());
    }
    setSelectedRegionId(null);
  }, []);

  const getAllRegions = useCallback((): RedactionRegion[] => {
    const allRegions: RedactionRegion[] = [];
    redactions.forEach((regions) => {
      allRegions.push(...regions);
    });
    return allRegions;
  }, [redactions]);

  const selectRegion = useCallback((regionId: string | null) => {
    setSelectedRegionId(regionId);
  }, []);

  const toggleRegion = useCallback((_pageNumber: number, regionId: string) => {
    // This could be used to enable/disable regions without removing them
    // For now, we'll just select/deselect
    setSelectedRegionId((prev) => (prev === regionId ? null : regionId));
  }, []);

  return {
    redactions,
    selectedRegionId,
    addAutoDetectedRegions,
    addManualRegion,
    removeRegion,
    getRegionsForPage,
    getRegionsByType,
    clearAllRegions,
    getAllRegions,
    selectRegion,
    toggleRegion,
  };
}

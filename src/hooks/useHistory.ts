import { useCallback, useState } from "react";
import type {
  HistoryActionType,
  HistoryEntry,
  InteractionMode,
  PIIType,
} from "@/types/redaction";

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const addEntry = useCallback(
    (
      action: HistoryActionType,
      description: string,
      metadata?: {
        page?: number;
        count?: number;
        format?: string;
        mode?: InteractionMode;
        piiType?: PIIType;
        [key: string]: unknown;
      },
    ) => {
      const entry: HistoryEntry = {
        id: `history-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        action,
        description,
        metadata,
      };

      setHistory((prev) => [entry, ...prev]); // Most recent first
    },
    [],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getHistory = useCallback(() => {
    return history;
  }, [history]);

  const getRecentEntries = useCallback(
    (count: number) => {
      return history.slice(0, count);
    },
    [history],
  );

  const getEntriesByAction = useCallback(
    (action: HistoryActionType) => {
      return history.filter((entry) => entry.action === action);
    },
    [history],
  );

  return {
    history,
    addEntry,
    clearHistory,
    getHistory,
    getRecentEntries,
    getEntriesByAction,
  };
}

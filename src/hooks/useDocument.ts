import { useCallback, useState } from "react";
import type { Document } from "@/types/redaction";

export function useDocument() {
  const [document, setDocument] = useState<Document | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);

  const loadDocument = useCallback((doc: Document) => {
    setDocument(doc);
    setCurrentPage(1);
    setZoom(1);
  }, []);

  const clearDocument = useCallback(() => {
    setDocument(null);
    setCurrentPage(1);
    setZoom(1);
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      if (document && page >= 1 && page <= document.pageCount) {
        setCurrentPage(page);
      }
    },
    [document],
  );

  const nextPage = useCallback(() => {
    if (document && currentPage < document.pageCount) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [document, currentPage]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const updateZoom = useCallback((newZoom: number) => {
    setZoom(Math.max(0.1, Math.min(5, newZoom)));
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(5, prev + 0.25));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(0.1, prev - 0.25));
  }, []);

  return {
    document,
    currentPage,
    zoom,
    loadDocument,
    clearDocument,
    goToPage,
    nextPage,
    previousPage,
    updateZoom,
    zoomIn,
    zoomOut,
  };
}

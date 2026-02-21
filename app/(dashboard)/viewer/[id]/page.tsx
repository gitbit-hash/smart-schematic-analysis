"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { SchematicCanvas } from "@/components/viewer/schematic-canvas";
import { DetailPanel } from "@/components/viewer/detail-panel";
import { ViewerToolbar } from "@/components/viewer/viewer-toolbar";
import { PageNavigator } from "@/components/viewer/page-navigator";

interface SchematicData {
  id: string;
  fileName: string;
  status: string;
  pageCount: number;
  pages: PageData[];
  components: ComponentData[];
  bomItems: BomItemData[];
}

export interface PageData {
  id: string;
  pageNumber: number;
  imageUrl: string;
  width: number;
  height: number;
  textBlocks: TextBlockData[];
  connections: unknown;
}

export interface ComponentData {
  id: string;
  pageId: string;
  type: string;
  refDesignator: string | null;
  value: string | null;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  attributes: Record<string, unknown> | null;
}

export interface TextBlockData {
  id: string;
  text: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  category: string;
}

export interface BomItemData {
  id: string;
  refDesignator: string;
  componentType: string;
  value: string | null;
  footprint: string | null;
  quantity: number;
  partNumber: string | null;
  price: number | null;
  inStock: boolean | null;
}

export type OverlayVisibility = {
  components: boolean;
  text: boolean;
  connections: boolean;
};

export default function ViewerPage() {
  const params = useParams();
  const id = params.id as string;

  const [schematic, setSchematic] = useState<SchematicData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedComponent, setSelectedComponent] = useState<ComponentData | null>(null);
  const [overlays, setOverlays] = useState<OverlayVisibility>({
    components: true,
    text: true,
    connections: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchSchematic = useCallback(async () => {
    try {
      const res = await fetch(`/api/schematics/${id}`);
      if (!res.ok) throw new Error("Failed to load schematic");
      const data = await res.json();
      setSchematic(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSchematic();
  }, [fetchSchematic]);

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/schematics/${id}/process`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Processing failed");
      }
      // Refetch after processing
      await fetchSchematic();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const currentPageData = schematic?.pages?.[currentPage] || null;
  const pageComponents = schematic?.components?.filter(
    (c) => c.pageId === currentPageData?.id
  ) || [];

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !schematic) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10">
          <svg className="h-8 w-8 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-foreground">Failed to load schematic</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Toolbar */}
      <ViewerToolbar
        fileName={schematic.fileName}
        status={schematic.status}
        overlays={overlays}
        onToggleOverlay={(key) =>
          setOverlays((prev) => ({ ...prev, [key]: !prev[key] }))
        }
        onProcess={handleProcess}
        isProcessing={isProcessing}
        hasPages={schematic.pages.length > 0}
      />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="relative flex-1 overflow-hidden bg-[#1a1a2e]">
          {schematic.status === "UPLOADED" ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <svg className="h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">Ready to Analyze</h2>
              <p className="max-w-sm text-sm text-white/60">
                Click &quot;Analyze&quot; in the toolbar to run AI detection on this schematic.
              </p>
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="gradient-primary mt-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl disabled:opacity-50"
              >
                {isProcessing ? "Analyzing..." : "Analyze Schematic"}
              </button>
            </div>
          ) : currentPageData ? (
            <SchematicCanvas
              page={currentPageData}
              components={overlays.components ? pageComponents : []}
              textBlocks={overlays.text ? currentPageData.textBlocks : []}
              selectedComponent={selectedComponent}
              onSelectComponent={setSelectedComponent}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white/40">
              No pages available
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {schematic.status === "COMPLETED" && (
          <DetailPanel
            component={selectedComponent}
            bomItems={schematic.bomItems}
            onClose={() => setSelectedComponent(null)}
          />
        )}
      </div>

      {/* Page Navigator */}
      {schematic.pages.length > 1 && (
        <PageNavigator
          pages={schematic.pages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

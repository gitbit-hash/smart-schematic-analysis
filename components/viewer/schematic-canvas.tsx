"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type {
  PageData,
  ComponentData,
  TextBlockData,
} from "@/app/(dashboard)/viewer/[id]/page";

interface SchematicCanvasProps {
  page: PageData;
  components: ComponentData[];
  textBlocks: TextBlockData[];
  selectedComponent: ComponentData | null;
  onSelectComponent: (c: ComponentData | null) => void;
}

const COMPONENT_COLORS: Record<string, string> = {
  resistor: "#3b82f6",
  capacitor: "#8b5cf6",
  ic: "#10b981",
  diode: "#f59e0b",
  transistor: "#ef4444",
  inductor: "#06b6d4",
  connector: "#f97316",
  switch: "#ec4899",
};

const TEXT_COLORS: Record<string, string> = {
  LABEL: "#60a5fa",
  VALUE: "#a78bfa",
  PIN: "#34d399",
  TITLE: "#fbbf24",
  NOTE: "#94a3b8",
};

export function SchematicCanvas({
  page,
  components,
  textBlocks,
  selectedComponent,
  onSelectComponent,
}: SchematicCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);

  // Fit to container on mount
  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / page.width;
    const scaleY = rect.height / page.height;
    const scale = Math.min(scaleX, scaleY) * 0.9;
    const x = (rect.width - page.width * scale) / 2;
    const y = (rect.height - page.height * scale) / 2;
    setTransform({ x, y, scale });
  }, [page.width, page.height]);

  // Zoom with mouse wheel
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const rect = containerRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      setTransform((prev) => {
        const newScale = Math.min(Math.max(prev.scale * delta, 0.1), 10);
        const ratio = newScale / prev.scale;
        return {
          scale: newScale,
          x: mx - (mx - prev.x) * ratio,
          y: my - (my - prev.y) * ratio,
        };
      });
    },
    []
  );

  // Pan handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    },
    [transform.x, transform.y]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    },
    [isPanning, panStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Zoom controls
  const zoomIn = () =>
    setTransform((prev) => ({ ...prev, scale: Math.min(prev.scale * 1.25, 10) }));
  const zoomOut = () =>
    setTransform((prev) => ({ ...prev, scale: Math.max(prev.scale * 0.8, 0.1) }));

  const fitToView = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / page.width;
    const scaleY = rect.height / page.height;
    const scale = Math.min(scaleX, scaleY) * 0.9;
    const x = (rect.width - page.width * scale) / 2;
    const y = (rect.height - page.height * scale) / 2;
    setTransform({ x, y, scale });
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full cursor-grab select-none overflow-hidden active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Transformed canvas layer */}
      <div
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: "0 0",
          width: page.width,
          height: page.height,
          position: "absolute",
          transition: isPanning ? "none" : "transform 0.1s ease-out",
        }}
      >
        {/* Page background (placeholder for real image) */}
        <div
          className="bg-white"
          style={{ width: page.width, height: page.height }}
        >
          {/* Grid pattern for mock pages */}
          <svg width={page.width} height={page.height} className="opacity-10">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#666" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Component overlays */}
        {components.map((comp) => {
          const isSelected = selectedComponent?.id === comp.id;
          const isHovered = hoveredComponent === comp.id;
          const color = COMPONENT_COLORS[comp.type] || "#6b7280";

          return (
            <div
              key={comp.id}
              className="absolute cursor-pointer transition-opacity"
              style={{
                left: comp.bbox.x,
                top: comp.bbox.y,
                width: comp.bbox.width,
                height: comp.bbox.height,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectComponent(isSelected ? null : comp);
              }}
              onMouseEnter={() => setHoveredComponent(comp.id)}
              onMouseLeave={() => setHoveredComponent(null)}
            >
              {/* Bounding box */}
              <div
                className="absolute inset-0 rounded-sm"
                style={{
                  border: `2px solid ${color}`,
                  backgroundColor: isSelected
                    ? `${color}30`
                    : isHovered
                      ? `${color}20`
                      : `${color}10`,
                  boxShadow: isSelected ? `0 0 12px ${color}50` : "none",
                }}
              />

              {/* Label */}
              <div
                className="absolute -top-5 left-0 whitespace-nowrap rounded px-1 py-0.5 text-[10px] font-bold leading-none"
                style={{
                  backgroundColor: color,
                  color: "white",
                  opacity: isSelected || isHovered ? 1 : 0.8,
                }}
              >
                {comp.refDesignator || comp.type}
                {comp.value && ` · ${comp.value}`}
              </div>
            </div>
          );
        })}

        {/* Text block overlays */}
        {textBlocks.map((tb) => {
          const color = TEXT_COLORS[tb.category] || "#94a3b8";

          return (
            <div
              key={tb.id}
              className="absolute"
              style={{
                left: tb.bbox.x,
                top: tb.bbox.y,
                width: tb.bbox.width,
                height: tb.bbox.height,
              }}
            >
              <div
                className="absolute inset-0 rounded-sm border border-dashed"
                style={{
                  borderColor: `${color}60`,
                  backgroundColor: `${color}08`,
                }}
              />
              <span
                className="absolute -bottom-3.5 left-0 text-[9px] font-medium leading-none"
                style={{ color }}
              >
                {tb.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 rounded-xl border border-white/10 bg-black/60 p-1 backdrop-blur-lg">
        <button
          onClick={zoomIn}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          onClick={fitToView}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          FIT
        </button>
        <button
          onClick={zoomOut}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute bottom-4 left-4 rounded-lg bg-black/60 px-2.5 py-1 text-xs text-white/60 backdrop-blur-lg">
        {Math.round(transform.scale * 100)}%
      </div>
    </div>
  );
}

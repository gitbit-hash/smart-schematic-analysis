"use client";

import type { OverlayVisibility } from "@/app/(dashboard)/viewer/[id]/page";

interface ViewerToolbarProps {
  fileName: string;
  status: string;
  overlays: OverlayVisibility;
  onToggleOverlay: (key: keyof OverlayVisibility) => void;
  onProcess: () => void;
  isProcessing: boolean;
  hasPages: boolean;
}

export function ViewerToolbar({
  fileName,
  status,
  overlays,
  onToggleOverlay,
  onProcess,
  isProcessing,
  hasPages,
}: ViewerToolbarProps) {
  const statusStyles: Record<string, string> = {
    UPLOADED: "bg-blue-500/10 text-blue-400",
    PROCESSING: "bg-warning/10 text-warning",
    COMPLETED: "bg-success/10 text-success",
    FAILED: "bg-danger/10 text-danger",
  };

  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
      {/* Left: File name + status */}
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-foreground truncate max-w-[200px]">
          {fileName}
        </h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status] || "bg-muted text-muted-foreground"}`}
        >
          {status}
        </span>
      </div>

      {/* Center: Layer toggles */}
      {hasPages && status === "COMPLETED" && (
        <div className="flex items-center gap-1 rounded-lg bg-secondary/50 p-1">
          <ToggleButton
            active={overlays.components}
            onClick={() => onToggleOverlay("components")}
            label="Components"
            color="#3b82f6"
          />
          <ToggleButton
            active={overlays.text}
            onClick={() => onToggleOverlay("text")}
            label="Text"
            color="#a78bfa"
          />
          <ToggleButton
            active={overlays.connections}
            onClick={() => onToggleOverlay("connections")}
            label="Connections"
            color="#10b981"
          />
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {status === "UPLOADED" && (
          <button
            onClick={onProcess}
            disabled={isProcessing}
            className="gradient-primary flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Analyzing...
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                </svg>
                Analyze
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
        }`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: active ? color : "#6b7280" }}
      />
      {label}
    </button>
  );
}

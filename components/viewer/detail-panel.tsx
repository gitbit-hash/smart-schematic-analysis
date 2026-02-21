"use client";

import { useState } from "react";
import type { ComponentData, BomItemData } from "@/app/(dashboard)/viewer/[id]/page";

interface DetailPanelProps {
  component: ComponentData | null;
  bomItems: BomItemData[];
  onClose: () => void;
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

export function DetailPanel({ component, bomItems, onClose }: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<"details" | "bom">("details");

  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-border bg-card">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("details")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "details"
            ? "border-b-2 border-primary text-primary"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Component
        </button>
        <button
          onClick={() => setActiveTab("bom")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "bom"
            ? "border-b-2 border-primary text-primary"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          BOM ({bomItems.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === "details" ? (
          component ? (
            <ComponentDetails component={component} onClose={onClose} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <svg className="h-6 w-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground">No component selected</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Click a component on the canvas to inspect it
              </p>
            </div>
          )
        ) : (
          <BomTable bomItems={bomItems} />
        )}
      </div>
    </div>
  );
}

function ComponentDetails({
  component,
  onClose,
}: {
  component: ComponentData;
  onClose: () => void;
}) {
  const color = COMPONENT_COLORS[component.type] || "#6b7280";

  const fields = [
    { label: "Type", value: component.type },
    { label: "Ref Designator", value: component.refDesignator || "—" },
    { label: "Value", value: component.value || "—" },
    {
      label: "Confidence",
      value: `${Math.round(component.confidence * 100)}%`,
    },
    {
      label: "Position",
      value: `(${Math.round(component.bbox.x)}, ${Math.round(component.bbox.y)})`,
    },
    {
      label: "Size",
      value: `${Math.round(component.bbox.width)} × ${Math.round(component.bbox.height)}`,
    },
  ];

  return (
    <div className="animate-fade-in p-4">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {component.refDesignator?.[0] || component.type[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {component.refDesignator || component.type}
            </h3>
            <p className="text-xs capitalize text-muted-foreground">
              {component.type}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        {fields.map((f) => (
          <div key={f.label} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
            <span className="text-xs text-muted-foreground">{f.label}</span>
            <span className="text-sm font-medium text-foreground">{f.value}</span>
          </div>
        ))}
      </div>

      {/* Confidence bar */}
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">AI Confidence</span>
          <span className="font-medium text-foreground">
            {Math.round(component.confidence * 100)}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${component.confidence * 100}%`,
              backgroundColor:
                component.confidence > 0.9
                  ? "#10b981"
                  : component.confidence > 0.7
                    ? "#f59e0b"
                    : "#ef4444",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function BomTable({ bomItems }: { bomItems: BomItemData[] }) {
  if (bomItems.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">No BOM data available</p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-3 py-2 font-medium text-muted-foreground">Ref</th>
              <th className="px-3 py-2 font-medium text-muted-foreground">Type</th>
              <th className="px-3 py-2 font-medium text-muted-foreground">Value</th>
              <th className="px-3 py-2 font-medium text-muted-foreground text-right">Qty</th>
              <th className="px-3 py-2 font-medium text-muted-foreground text-right">Price</th>
              <th className="px-3 py-2 font-medium text-muted-foreground text-center">Stock</th>
            </tr>
          </thead>
          <tbody>
            {bomItems.map((item) => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="px-3 py-2 font-medium text-foreground">{item.refDesignator}</td>
                <td className="px-3 py-2 capitalize text-muted-foreground">{item.componentType}</td>
                <td className="px-3 py-2 text-foreground">{item.value || "—"}</td>
                <td className="px-3 py-2 text-right text-foreground">{item.quantity}</td>
                <td className="px-3 py-2 text-right text-foreground">
                  {item.price != null ? `$${item.price.toFixed(2)}` : "—"}
                </td>
                <td className="px-3 py-2 text-center">
                  {item.inStock != null ? (
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${item.inStock ? "bg-success" : "bg-danger"
                        }`}
                    />
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="mt-3 flex justify-between rounded-lg bg-secondary/50 px-3 py-2 text-xs">
        <span className="text-muted-foreground">
          {bomItems.length} unique items · {bomItems.reduce((s, i) => s + i.quantity, 0)} total
        </span>
        <span className="font-medium text-foreground">
          ${bomItems
            .reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0)
            .toFixed(2)}
        </span>
      </div>
    </div>
  );
}

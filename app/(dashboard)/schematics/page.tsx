"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { UploadDialog } from "@/components/schematics/upload-dialog";

interface Schematic {
  id: string;
  fileName: string;
  fileSize: number;
  pageCount: number | null;
  status: string;
  createdAt: string;
  _count: { components: number };
}

export default function SchematicsPage() {
  const [schematics, setSchematics] = useState<Schematic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const fetchSchematics = useCallback(async () => {
    try {
      const res = await fetch("/api/schematics");
      if (res.ok) {
        const data = await res.json();
        setSchematics(data.schematics);
      }
    } catch (err) {
      console.error("Failed to fetch schematics:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchematics();
  }, [fetchSchematics]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this schematic? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/schematics/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSchematics((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      UPLOADED: "bg-blue-500/10 text-blue-400",
      PROCESSING: "bg-warning/10 text-warning",
      ANALYZED: "bg-success/10 text-success",
      ERROR: "bg-danger/10 text-danger",
    };
    return styles[status] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Schematics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and analyze your uploaded schematics
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="gradient-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Upload PDF
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="glass flex items-center justify-center rounded-2xl p-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : schematics.length === 0 ? (
        /* Empty State */
        <div className="glass flex flex-col items-center justify-center rounded-2xl p-16 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <svg className="h-10 w-10 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="12" y1="12" x2="12" y2="18" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            No schematics uploaded
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Upload your first PDF schematic to start detecting components, extracting text, and generating BOMs with AI.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="gradient-primary mt-8 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17,8 12,3 7,8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload Schematic
          </button>
        </div>
      ) : (
        /* Schematics List */
        <div className="space-y-3">
          {schematics.map((s) => (
            <div
              key={s.id}
              className="glass group flex items-center gap-4 rounded-2xl p-4 transition-all hover:border-primary/20"
            >
              {/* Icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="truncate font-semibold text-foreground">
                  {s.fileName}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatSize(s.fileSize)}</span>
                  {s.pageCount && <span>{s.pageCount} pages</span>}
                  <span>{s._count.components} components</span>
                  <span>{formatDate(s.createdAt)}</span>
                </div>
              </div>

              {/* Status */}
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusBadge(s.status)}`}
              >
                {s.status}
              </span>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/viewer/${s.id}`}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  {s.status === "COMPLETED" ? "View" : "Analyze"}
                </Link>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="shrink-0 rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="3,6 5,6 21,6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <UploadDialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUploadComplete={fetchSchematics}
      />
    </div>
  );
}

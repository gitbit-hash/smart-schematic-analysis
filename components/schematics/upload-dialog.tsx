"use client";

import { useState, useCallback, useRef } from "react";

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export function UploadDialog({
  open,
  onClose,
  onUploadComplete,
}: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setError("");
    setIsDragging(false);
  }, []);

  const handleClose = useCallback(() => {
    if (status === "uploading") return; // Don't close while uploading
    reset();
    onClose();
  }, [status, reset, onClose]);

  const handleFile = useCallback((f: File) => {
    if (f.type !== "application/pdf") {
      setError("Only PDF files are accepted");
      return;
    }
    if (f.size > 200 * 1024 * 1024) {
      setError("File size exceeds 200 MB limit");
      return;
    }
    setFile(f);
    setError("");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    setProgress(10);
    setError("");

    try {
      // Step 1: Get presigned URL from our API
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create upload");
      }

      const { uploadUrl } = await res.json();
      setProgress(30);

      // Step 2: Upload file directly to S3/R2 via presigned URL
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file to storage");
      }

      setProgress(100);
      setStatus("success");

      // Refresh parent after brief delay
      setTimeout(() => {
        onUploadComplete();
        handleClose();
      }, 1200);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg animate-slide-up rounded-2xl border border-border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Upload Schematic</h2>
          <button
            onClick={handleClose}
            disabled={status === "uploading"}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-all ${isDragging
              ? "border-primary bg-primary/5"
              : file
                ? "border-success/30 bg-success/5"
                : "border-border hover:border-primary/50 hover:bg-primary/5"
            }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />

          {file ? (
            <>
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-success/10">
                <svg className="h-7 w-7 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
              </div>
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </>
          ) : (
            <>
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                <svg className="h-7 w-7 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17,8 12,3 7,8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="font-medium text-foreground">
                {isDragging ? "Drop your PDF here" : "Drag & drop your PDF"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                or click to browse · Max 200 MB
              </p>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg bg-danger/10 px-4 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Progress Bar */}
        {status === "uploading" && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Uploading…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="gradient-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2.5 text-sm text-success">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12" />
            </svg>
            Upload complete!
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={status === "uploading"}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || status === "uploading" || status === "success"}
            className="gradient-primary rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:shadow-none"
          >
            {status === "uploading"
              ? "Uploading…"
              : status === "success"
                ? "Done!"
                : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}

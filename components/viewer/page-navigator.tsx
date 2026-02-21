"use client";

import type { PageData } from "@/app/(dashboard)/viewer/[id]/page";

interface PageNavigatorProps {
  pages: PageData[];
  currentPage: number;
  onPageChange: (index: number) => void;
}

export function PageNavigator({
  pages,
  currentPage,
  onPageChange,
}: PageNavigatorProps) {
  return (
    <div className="flex items-center gap-2 border-t border-border bg-card px-4 py-2">
      {/* Prev button */}
      <button
        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15,18 9,12 15,6" />
        </svg>
      </button>

      {/* Page thumbnails */}
      <div className="flex flex-1 items-center gap-1.5 overflow-x-auto px-1 custom-scrollbar">
        {pages.map((page, index) => (
          <button
            key={page.id}
            onClick={() => onPageChange(index)}
            className={`flex shrink-0 items-center justify-center rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition-all ${index === currentPage
                ? "border-primary bg-primary/10 text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground"
              }`}
          >
            Page {page.pageNumber}
          </button>
        ))}
      </div>

      {/* Next button */}
      <button
        onClick={() => onPageChange(Math.min(pages.length - 1, currentPage + 1))}
        disabled={currentPage === pages.length - 1}
        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9,18 15,12 9,6" />
        </svg>
      </button>

      {/* Page counter */}
      <span className="ml-2 shrink-0 text-xs text-muted-foreground">
        {currentPage + 1} / {pages.length}
      </span>
    </div>
  );
}

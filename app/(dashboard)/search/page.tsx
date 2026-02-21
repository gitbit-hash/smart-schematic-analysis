"use client";

import { useState } from "react";
import Link from "next/link";

interface SearchResult {
  id: string;
  type: string;
  refDesignator: string | null;
  value: string | null;
  confidence: number;
  schematicId: string;
  schematicName: string;
  pageNumber: number;
}

const COMPONENT_TYPES = [
  "resistor", "capacitor", "ic", "diode", "transistor",
  "inductor", "connector", "switch",
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query && !typeFilter) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (typeFilter) params.set("type", typeFilter);

      const res = await fetch(`/api/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.components);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find components and text across all your schematics
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by ref designator, value, or type (e.g. R1, 10kΩ, LM7805)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-secondary/50 py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">All Types</option>
          {COMPONENT_TYPES.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isSearching}
          className="gradient-primary rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl disabled:opacity-50"
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Results */}
      {isSearching ? (
        <div className="glass flex items-center justify-center rounded-2xl p-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="glass flex flex-col items-center justify-center rounded-2xl p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <svg className="h-8 w-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground">No results found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search term or component type
          </p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {results.length} component{results.length !== 1 ? "s" : ""} found
          </p>
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/viewer/${r.schematicId}`}
              className="glass group flex items-center gap-4 rounded-xl p-4 transition-all hover:border-primary/20"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                {r.refDesignator?.[0] || r.type[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {r.refDesignator || r.type}
                  </span>
                  {r.value && (
                    <span className="text-sm text-muted-foreground">· {r.value}</span>
                  )}
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize text-muted-foreground">
                    {r.type}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {r.schematicName} · Page {r.pageNumber} · {Math.round(r.confidence * 100)}% confidence
                </p>
              </div>
              <svg className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

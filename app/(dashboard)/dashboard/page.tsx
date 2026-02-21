"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Stats {
  totalSchematics: number;
  totalComponents: number;
  totalPages: number;
  searches: number;
  tier: string;
  schematicLimit: number;
  recentSchematics: {
    id: string;
    fileName: string;
    status: string;
    createdAt: string;
    _count: { components: number };
  }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      UPLOADED: "bg-blue-500/10 text-blue-400",
      PROCESSING: "bg-warning/10 text-warning",
      COMPLETED: "bg-success/10 text-success",
      FAILED: "bg-danger/10 text-danger",
    };
    return styles[status] || "bg-muted text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your schematic analysis activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Schematics"
          value={String(stats?.totalSchematics || 0)}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
          }
        />
        <StatsCard
          label="Components Detected"
          value={String(stats?.totalComponents || 0)}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          }
        />
        <StatsCard
          label="Pages Processed"
          value={String(stats?.totalPages || 0)}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
            </svg>
          }
        />
        <StatsCard
          label="Searches"
          value={String(stats?.searches || 0)}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          }
        />
      </div>

      {/* Usage Bar */}
      {stats && stats.schematicLimit !== Infinity && (
        <div className="glass rounded-2xl p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Usage — <span className="font-medium text-foreground capitalize">{stats.tier.toLowerCase()}</span> plan
            </span>
            <span className="font-medium text-foreground">
              {stats.totalSchematics} / {stats.schematicLimit} schematics
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all gradient-primary"
              style={{
                width: `${Math.min((stats.totalSchematics / stats.schematicLimit) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/schematics"
            className="glass group flex items-center gap-4 rounded-2xl p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="gradient-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg shadow-primary/25">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary">
                Upload Schematic
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Upload a PDF schematic for AI analysis
              </p>
            </div>
          </Link>

          <Link
            href="/search"
            className="glass group flex items-center gap-4 rounded-2xl p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <svg className="h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-accent">
                Search Components
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Find components across all schematics
              </p>
            </div>
          </Link>

          <Link
            href="/schematics"
            className="glass group flex items-center gap-4 rounded-2xl p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/10">
              <svg className="h-6 w-6 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-success">
                View Schematics
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Browse your uploaded schematics
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Activity</h2>
        {!stats?.recentSchematics?.length ? (
          <div className="glass flex flex-col items-center justify-center rounded-2xl p-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <svg className="h-8 w-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground">No activity yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Upload your first schematic to get started with AI-powered analysis
            </p>
            <Link
              href="/schematics"
              className="gradient-primary mt-6 inline-block rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              Upload Schematic
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recentSchematics.map((s) => (
              <Link
                key={s.id}
                href={`/viewer/${s.id}`}
                className="glass group flex items-center gap-4 rounded-xl p-4 transition-all hover:border-primary/20"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-foreground">{s.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {s._count.components} components · {formatDate(s.createdAt)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(s.status)}`}
                >
                  {s.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatsCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}

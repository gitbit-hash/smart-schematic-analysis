export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="gradient-primary flex h-9 w-9 items-center justify-center rounded-xl shadow-lg shadow-primary/25">
        <svg
          className="h-5 w-5 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.6-3.6a7 7 0 0 1-9.8 9.8L4 22.3a2.1 2.1 0 0 1-3-3l6.8-7.5a7 7 0 0 1 9.8-9.8L14.7 6.3z" />
        </svg>
      </div>
      <span className="text-lg font-bold text-foreground">
        Smart<span className="gradient-text">Schematic</span>
      </span>
    </div>
  );
}

export function LiveIndicator({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="live-pulse relative flex h-2.5 w-2.5 rounded-full bg-lime" />
      <div className="leading-tight">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">Live</p>
        {compact ? null : (
          <p className="text-[11px] text-muted-foreground">Real-time Intelligence</p>
        )}
      </div>
    </div>
  );
}

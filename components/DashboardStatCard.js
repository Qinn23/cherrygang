export function DashboardStatCard({
  title,
  value,
  subtext,
  accent = "emerald",
  icon,
}) {
  const accentMap = {
    emerald: {
      ring: "ring-emerald-500/15",
      bg: "bg-emerald-500/12",
      text: "text-emerald-800",
    },
    amber: {
      ring: "ring-amber-500/15",
      bg: "bg-amber-500/12",
      text: "text-amber-800",
    },
    rose: {
      ring: "ring-rose-500/15",
      bg: "bg-rose-500/12",
      text: "text-rose-800",
    },
    sky: {
      ring: "ring-sky-500/15",
      bg: "bg-sky-500/12",
      text: "text-sky-800",
    },
    zinc: {
      ring: "ring-zinc-500/15",
      bg: "bg-zinc-500/12",
      text: "text-zinc-700",
    },
  };

  const a = accentMap[accent] ?? accentMap.emerald;

  return (
    <div className="rounded-2xl border border-amber-200/60 bg-white/80 p-5 shadow-sm ring-1 ring-inset ring-white/50 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-700">
            {title}
          </p>
          <p className="mt-2 truncate text-3xl font-semibold tracking-tight text-zinc-900">
            {value}
          </p>
          {subtext ? (
            <p className="mt-2 text-sm text-zinc-600">
              {subtext}
            </p>
          ) : null}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${a.bg} ${a.text} ring-1 ring-inset ${a.ring}`}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
    </div>
  );
}


function severityStyles(severity) {
  switch (severity) {
    case "danger":
      return {
        bar: "bg-rose-500",
        pill: "bg-rose-500/10 text-rose-800 ring-rose-500/20",
      };
    case "warning":
      return {
        bar: "bg-amber-500",
        pill:
          "bg-amber-500/10 text-amber-800 ring-amber-500/20",
      };
    default:
      return {
        bar: "bg-sky-500",
        pill: "bg-sky-500/10 text-sky-800 ring-sky-500/20",
      };
  }
}

export function AlertsPanel({ alerts = [] }) {
  return (
    <section className="rounded-2xl border border-amber-200/60 bg-white/80 p-5 shadow-sm ring-1 ring-inset ring-white/50 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold tracking-tight text-zinc-900">
          Alerts
        </h2>
        <span className="text-sm text-zinc-600">
          {alerts.length} active
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-amber-200/70 bg-white/60 p-4 text-sm text-zinc-700">
            You’re all set — no alerts right now.
          </div>
        ) : (
          alerts.map((a) => {
            const s = severityStyles(a.severity);
            return (
              <div
                key={a.id}
                className="relative overflow-hidden rounded-xl border border-amber-200/60 bg-amber-50/60 p-4"
              >
                <div className={`absolute inset-y-0 left-0 w-1.5 ${s.bar}`} />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900">
                      {a.title}
                    </p>
                    <p className="mt-1 text-sm text-zinc-700">
                      {a.description}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${s.pill}`}
                  >
                    {a.severity}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}


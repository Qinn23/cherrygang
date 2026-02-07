export function DashboardStatCard({
  title,
  value,
  subtext,
  accent = "emerald",
  icon,
}) {
  const accentMap = {
    emerald: {
      ring: "ring-macaron-mint",
      bg: "bg-macaron-mint",
      text: "text-macaron-mint-dark",
      border: "border-macaron-mint",
      gradient: "bg-gradient-macaron-mint",
    },
    amber: {
      ring: "ring-macaron-peach",
      bg: "bg-macaron-peach",
      text: "text-macaron-peach-dark",
      border: "border-macaron-peach",
      gradient: "bg-gradient-macaron-peach",
    },
    rose: {
      ring: "ring-macaron-pink",
      bg: "bg-macaron-pink",
      text: "text-macaron-pink-dark",
      border: "border-macaron-pink",
      gradient: "bg-gradient-macaron-pink",
    },
    sky: {
      ring: "ring-macaron-sky",
      bg: "bg-macaron-sky",
      text: "text-macaron-sky-dark",
      border: "border-macaron-sky",
      gradient: "bg-gradient-macaron-sky",
    },
    zinc: {
      ring: "ring-macaron-lavender",
      bg: "bg-macaron-lavender",
      text: "text-macaron-lavender-dark",
      border: "border-macaron-lavender",
      gradient: "bg-gradient-macaron-lavender",
    },
  };

  const a = accentMap[accent] ?? accentMap.emerald;

  return (
    <div className={`rounded-2xl border-2 ${a.border} bg-white/90 p-5 shadow-macaron-md ring-2 ring-inset ${a.ring}/20 backdrop-blur hover:shadow-macaron-lg transition-all`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="stat-label text-gray-700">
            {title}
          </p>
          <p className="stat-value mt-2 text-gray-900">
            {value}
          </p>
          {subtext ? (
            <p className="card-subtitle mt-3 text-gray-700">
              {subtext}
            </p>
          ) : null}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${a.gradient} text-white ring-2 ring-inset ${a.ring}`}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
    </div>
  );
}


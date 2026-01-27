export function RecipeCard({ recipe }) {
  return (
    <div className="group rounded-2xl border border-amber-200/60 bg-white/80 p-5 shadow-sm ring-1 ring-inset ring-white/50 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-tight text-zinc-900">
            {recipe.name}
          </p>
          <p className="mt-1 text-sm text-zinc-700">
            {recipe.timeMins} min • {recipe.difficulty}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-medium text-zinc-900">
            {recipe.matchPct}%
          </p>
          <p className="text-xs text-zinc-600">match</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-amber-100/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-lime-500 to-amber-400 transition-all"
            style={{ width: `${recipe.matchPct}%` }}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-zinc-600">
          Uses soon
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {recipe.usesSoon.map((i) => (
            <span
              key={i}
              className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-900 ring-1 ring-inset ring-amber-500/20"
            >
              {i}
            </span>
          ))}
        </div>
      </div>

      {recipe.missing?.length ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-zinc-600">
            Missing
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {recipe.missing.map((i) => (
              <span
                key={i}
                className="rounded-full bg-zinc-500/10 px-2.5 py-1 text-xs font-medium text-zinc-800 ring-1 ring-inset ring-zinc-500/15"
              >
                {i}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}


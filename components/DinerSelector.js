import { useProfiles } from "@/components/ProfilesContext";

export function DinerSelector() {
  const { profiles, selectedDinerIds, setSelectedDinerIds, isHydrated } =
    useProfiles();

  const allIds = profiles.map((p) => p.id);
  const allSelected =
    selectedDinerIds.length > 0 &&
    allIds.every((id) => selectedDinerIds.includes(id));

  function toggle(id) {
    setSelectedDinerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function setAll() {
    setSelectedDinerIds(allIds);
  }

  if (!isHydrated) return null;

  return (
    <section className="rounded-2xl border border-amber-200/60 bg-white/80 p-5 shadow-sm ring-1 ring-inset ring-white/50 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900">
            Who’s eating?
          </h2>
          <p className="mt-1 text-sm text-zinc-700">
            Recipe filters apply only to selected diners.
          </p>
        </div>

        <button
          type="button"
          onClick={setAll}
          className="rounded-full bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-900 ring-1 ring-inset ring-amber-500/20 hover:bg-amber-500/20"
          aria-pressed={allSelected}
        >
          Select all
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {profiles.map((p) => {
          const on = selectedDinerIds.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={
                on
                  ? "rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-900 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-500/20"
                  : "rounded-full bg-zinc-500/10 px-3 py-1 text-sm font-medium text-zinc-800 ring-1 ring-inset ring-zinc-500/15 hover:bg-zinc-500/15"
              }
              aria-pressed={on}
            >
              {p.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}


import React from "react";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const COMMUNITY_TIPS = [
  { id: 1, title: "Banana peel tea", body: "Soak peels in water 24–48h, dilute 1:3, use on potted plants every 2–3 weeks.", tags: ["potassium", "pots"] },
  { id: 2, title: "Eggshell powder", body: "Rinse, dry, bake lightly, crush. Add a spoonful to tomato soil for calcium.", tags: ["calcium", "garden"] },
  { id: 3, title: "Coffee grounds", body: "Dry and sprinkle a thin layer as mulch on top of soil; don’t mix in heavily.", tags: ["indoor", "mulch"] },
];

export default function FertilizerPage() {
  const [waste, setWaste] = React.useState("");
  const [household, setHousehold] = React.useState("");
  const [garden, setGarden] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!waste.trim() || loading) return;

    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/ai-fertilizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wasteDescription: waste,
          householdDescription: household,
          gardenDescription: garden,
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const data = await res.json();
      setResult(data.text ?? "");
    } catch (err) {
      setResult(
        "I ran into a problem talking to Gemini. Please check your GEMINI_API_KEY and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`${geistSans.className} ${geistMono.className} flex min-h-screen flex-col bg-slate-100 text-slate-900`}
    >
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Fertilizer tips
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Turn scraps into compost or plant food.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:flex-row">
        {/* Left: AI planner */}
        <section className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="waste" className="text-xs font-semibold text-slate-600">
                What&apos;s going bad?
              </label>
              <textarea
                id="waste"
                rows={2}
                className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                placeholder="e.g. banana peels, eggshells, coffee grounds"
                value={waste}
                onChange={(e) => setWaste(e.target.value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="household" className="text-xs font-semibold text-slate-600">
                  Household (optional)
                </label>
                <textarea
                  id="household"
                  rows={1}
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                  placeholder="apartment, kids, pets…"
                  value={household}
                  onChange={(e) => setHousehold(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="garden" className="text-xs font-semibold text-slate-600">
                  Plants (optional)
                </label>
                <textarea
                  id="garden"
                  rows={1}
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                  placeholder="balcony, indoor, garden…"
                  value={garden}
                  onChange={(e) => setGarden(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 items-center rounded-full bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "…" : "Get plan"}
              </button>
            </div>
          </form>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 text-xs font-semibold text-slate-600">Plan</div>
            <div className="prose prose-sm max-w-none text-slate-900 prose-headings:mt-3 prose-headings:mb-1 prose-p:my-0.5 prose-ul:my-0.5">
              {result ? (
                <pre className="whitespace-pre-wrap break-words text-sm font-normal text-slate-900">
                  {result}
                </pre>
              ) : (
                <p className="text-sm text-slate-500">Results show here.</p>
              )}
            </div>
            <p className="mt-2 text-[10px] text-slate-400">Powered by Gemini.</p>
          </div>
        </section>

        {/* Right: impact & community tips */}
        <aside className="mt-4 flex w-full flex-col gap-4 lg:mt-0 lg:w-72">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold text-slate-900">Impact</h2>
            <p className="mt-1 text-[11px] text-slate-500">1 kg composted ≈ 2.5 kg CO₂e saved.</p>
            <ImpactEstimator />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold text-slate-900">Quick tips</h2>
            <div className="mt-2 space-y-2">
              {COMMUNITY_TIPS.map((tip) => (
                <article key={tip.id} className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                  <h3 className="text-xs font-semibold text-slate-900">{tip.title}</h3>
                  <p className="mt-0.5 text-[11px] text-slate-600">{tip.body}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {tip.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-200/60 px-1.5 py-0.5 text-[10px] text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

function ImpactEstimator() {
  const [kg, setKg] = React.useState("1");

  const numeric = Number(kg.replace(",", "."));
  const valid = !Number.isNaN(numeric) && numeric >= 0;
  const savedCo2 = valid ? numeric * 2.5 : 0;

  return (
    <div className="mt-2 space-y-1 text-xs">
      <label className="flex items-center gap-2">
        <span className="text-slate-600">Waste (kg)</span>
        <input
          type="number"
          min="0"
          step="0.1"
          value={kg}
          onChange={(e) => setKg(e.target.value)}
          className="h-7 w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-900 outline-none focus:border-slate-400"
        />
      </label>
      <p className="text-slate-600">
        ≈ <span className="font-semibold">{savedCo2.toFixed(1)} kg</span> CO₂e saved.
      </p>
    </div>
  );
}


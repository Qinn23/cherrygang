import React from "react";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const COMMUNITY_TIPS = [
  {
    id: 1,
    title: "Banana peel tea for leafy greens",
    body: "Soak chopped banana peels in a jar of water for 24–48 hours, then dilute 1:3 with water and use on potted plants once every 2–3 weeks.",
    tags: ["potassium boost", "balcony pots"],
  },
  {
    id: 2,
    title: "Eggshell powder for tomatoes",
    body: "Rinse and dry eggshells, then bake lightly and crush to a fine powder. Mix a spoonful into the topsoil around tomato plants to slowly add calcium.",
    tags: ["calcium", "vegetable garden"],
  },
  {
    id: 3,
    title: "Coffee grounds as mulch, not soil",
    body: "Dry used coffee grounds and sprinkle a thin layer on top of soil as mulch, then cover with other mulch. Avoid mixing large amounts directly into soil.",
    tags: ["indoor plants", "mulch"],
  },
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Fertilizer & compost
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              Turn food waste into plant food
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Describe your scraps and garden situation, and we&apos;ll suggest safe, practical
              ways to turn them into compost or DIY fertilizer.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:flex-row">
        {/* Left: AI planner */}
        <section className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">
            AI fertilizer & compost planner
          </h2>
          <p className="text-xs text-slate-500">
            Tell us what&apos;s going bad and where you can safely use fertilizer (balcony, garden,
            indoor plants, etc.).
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="waste"
                className="text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Food waste & materials
              </label>
              <textarea
                id="waste"
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                placeholder="E.g. wilted spinach, coffee grounds, banana peels, eggshells, stale bread..."
                value={waste}
                onChange={(e) => setWaste(e.target.value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="household"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Household (optional)
                </label>
                <textarea
                  id="household"
                  rows={2}
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                  placeholder="E.g. small apartment, 2 kids, 1 dog, want low smell and low pests..."
                  value={household}
                  onChange={(e) => setHousehold(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="garden"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Plants / garden (optional)
                </label>
                <textarea
                  id="garden"
                  rows={2}
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                  placeholder="E.g. balcony herbs, 3 indoor plants, a few tomato plants on balcony..."
                  value={garden}
                  onChange={(e) => setGarden(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] text-slate-500">
                Avoid adding meat, large amounts of oil, or dairy unless you know advanced
                composting methods.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 items-center rounded-full bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "Planning…" : "Generate fertilizer plan"}
              </button>
            </div>
          </form>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Plan
            </div>
            <div className="prose prose-sm max-w-none text-slate-900 prose-headings:mt-4 prose-headings:mb-2 prose-p:my-1 prose-ul:my-1">
              {result ? (
                <pre className="whitespace-pre-wrap break-words text-sm font-normal text-slate-900">
                  {result}
                </pre>
              ) : (
                <p className="text-sm text-slate-500">
                  Your fertilizer ideas will appear here after you generate them.
                </p>
              )}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Powered by Gemini. Always follow local guidelines and use caution with food safety,
              pets and children.
            </p>
          </div>
        </section>

        {/* Right: impact & community tips */}
        <aside className="mt-4 flex w-full flex-col gap-4 lg:mt-0 lg:w-80">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">
              Simple impact estimate
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Rough rule of thumb: every 1 kg of food waste you compost instead of binning saves
              around 2.5 kg of CO₂e.
            </p>
            <ImpactEstimator />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">
              Community fertilizer tips
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Curated ideas from home gardeners. Great starting points before you ask the AI.
            </p>
            <div className="mt-3 space-y-3">
              {COMMUNITY_TIPS.map((tip) => (
                <article
                  key={tip.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <h3 className="text-xs font-semibold text-slate-900">{tip.title}</h3>
                  <p className="mt-1 text-xs text-slate-600">{tip.body}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tip.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] font-medium text-slate-600"
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
    <div className="mt-3 space-y-2 text-xs">
      <label className="flex items-center gap-2">
        <span className="text-slate-600">Food waste this month (kg)</span>
        <input
          type="number"
          min="0"
          step="0.1"
          value={kg}
          onChange={(e) => setKg(e.target.value)}
          className="h-7 w-20 rounded-full border border-slate-200 bg-slate-50 px-2 text-xs text-slate-900 outline-none focus:border-slate-400"
        />
      </label>
      <p className="text-slate-600">
        If you compost that instead of binning it, you avoid roughly{" "}
        <span className="font-semibold">{savedCo2.toFixed(1)} kg</span> CO₂e going to landfill.
      </p>
      <p className="text-[10px] text-slate-400">
        Based on a very approximate factor of 2.5 kg CO₂e per kg of food waste.
      </p>
    </div>
  );
}


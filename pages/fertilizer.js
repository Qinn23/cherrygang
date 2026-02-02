import React from "react";
import { DM_Sans } from "next/font/google";
import { Card, CardBody, Button } from "@heroui/react";
import Link from "next/link";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
      className={`${dmSans.className} flex min-h-screen flex-col bg-gradient-to-b from-lime-50 via-white to-emerald-50 text-slate-900`}
    >
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-semibold text-white shadow-sm">
            SP
          </div>
          <span className="text-sm font-medium tracking-tight text-slate-800">
            Smart Pantry
          </span>
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
          M
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pb-10 pt-2 sm:px-6 sm:pt-4 lg:flex-row">
        {/* Left: AI planner */}
        <Card shadow="sm" className="flex-1 border-none bg-white/80 backdrop-blur-md">
          <CardBody className="space-y-4 p-4 sm:p-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-lime-700">
                Fertilizer tips
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                Turn scraps into compost or plant food.
              </h1>
              <p className="text-xs text-slate-500">
                Describe your kitchen waste and plants, and we&apos;ll suggest gentle, low-waste
                ways to feed your soil.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="waste" className="text-xs font-semibold text-slate-600">
                  What&apos;s going bad?
                </label>
                <textarea
                  id="waste"
                  rows={2}
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-300"
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
                    className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-300"
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
                    className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-300"
                    placeholder="balcony, indoor, garden…"
                    value={garden}
                    onChange={(e) => setGarden(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  isDisabled={loading}
                  className="inline-flex h-10 items-center rounded-full bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  {loading ? "…" : "Get plan"}
                </Button>
              </div>
            </form>

            <div className="mt-2 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-lime-50/60 p-4">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Plan</span>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] text-lime-700">
                  Gemini · Fertilizer
                </span>
              </div>
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
          </CardBody>
        </Card>

        {/* Right: impact & community tips */}
        <aside className="mt-4 flex w-full flex-col gap-4 lg:mt-0 lg:w-72">
          <Card shadow="sm" className="border-none bg-white/80 backdrop-blur-md">
            <CardBody className="p-4">
              <h2 className="text-xs font-semibold text-slate-900">Impact</h2>
              <p className="mt-1 text-[11px] text-slate-500">
                1 kg composted ≈ 2.5 kg CO₂e saved.
              </p>
              <ImpactEstimator />
            </CardBody>
          </Card>

          <Card shadow="sm" className="border-none bg-white/80 backdrop-blur-md">
            <CardBody className="p-4">
              <h2 className="text-xs font-semibold text-slate-900">Quick tips</h2>
              <div className="mt-2 space-y-2">
                {COMMUNITY_TIPS.map((tip) => (
                  <article
                    key={tip.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2"
                  >
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
            </CardBody>
          </Card>
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


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
  const [ideas, setIdeas] = React.useState([]);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = React.useState(null);
  const [pickNumber, setPickNumber] = React.useState("");
  const [mode, setMode] = React.useState("ai"); // "ai" | "map"
  const [locationQuery, setLocationQuery] = React.useState("");
  const [mapMode, setMapMode] = React.useState("dropoff"); // "dropoff" | "pickup"

  async function handleSubmit(e) {
    e.preventDefault();
    if (!waste.trim() || loading) return;

    setLoading(true);
    setResult("");
    setIdeas([]);
    setSelectedIdeaIndex(null);
    setPickNumber("");

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
      let nextIdeas = Array.isArray(data.ideas) ? data.ideas : [];
      let fallbackText = data.text ?? "";

      if (!nextIdeas.length && typeof fallbackText === "string" && fallbackText.trim()) {
        const cleaned = fallbackText
          .trim()
          .replace(/^```(?:json)?/i, "")
          .replace(/```$/i, "")
          .trim();

        if (cleaned.startsWith("{") && cleaned.includes('"ideas"')) {
          try {
            const tryRepairJson = (raw) => {
              let jsonStr = raw.trim();
              if (!jsonStr.endsWith("}")) {
                const lastBrace = jsonStr.lastIndexOf("}");
                if (lastBrace > -1) {
                  jsonStr = jsonStr.slice(0, lastBrace + 1);
                }
              }

              const openBraces = (jsonStr.match(/{/g) || []).length;
              const closeBraces = (jsonStr.match(/}/g) || []).length;
              const openBrackets = (jsonStr.match(/\[/g) || []).length;
              const closeBrackets = (jsonStr.match(/\]/g) || []).length;

              for (let i = 0; i < openBrackets - closeBrackets; i++) jsonStr += "]";
              for (let i = 0; i < openBraces - closeBraces; i++) jsonStr += "}";

              return jsonStr;
            };

            let parsed;
            try {
              parsed = JSON.parse(cleaned);
            } catch (firstErr) {
              parsed = JSON.parse(tryRepairJson(cleaned));
            }
            if (Array.isArray(parsed?.ideas)) {
              nextIdeas = parsed.ideas
                .filter((i) => i?.title)
                .map((i) => ({
                  title: i.title,
                  summary: i?.summary || "",
                  steps: Array.isArray(i?.steps) ? i.steps : [],
                  bestFor: Array.isArray(i?.bestFor) ? i.bestFor : [],
                  safetyNotes: Array.isArray(i?.safetyNotes) ? i.safetyNotes : [],
                }))
                .filter((i) => i.title && i.steps.length);

              if (nextIdeas.length) {
                fallbackText = "";
              }
            }
          } catch (parseErr) {
            fallbackText = "The plan could not be formatted. Please try again.";
          }
        }
      }

      setIdeas(nextIdeas);
      setResult(nextIdeas.length ? "" : fallbackText);
    } catch (err) {
      setResult(
        "I ran into a problem talking to Gemini. Please check your GEMINI_API_KEY and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function selectIdeaByNumber(value) {
    const n = Number(String(value).trim());
    if (!Number.isFinite(n)) return;
    const idx = n - 1;
    if (idx < 0 || idx >= ideas.length) return;
    setSelectedIdeaIndex(idx);
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-lime-700">
                  Fertilizer helper
                </p>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  Use scraps at home or find drop-off points.
                </h1>
                <p className="text-xs text-slate-500">
                  Choose to get a custom plan from Gemini or see nearby places that accept food waste
                  for compost and fertilizer.
                </p>
              </div>
              <div className="inline-flex items-center justify-between gap-2 rounded-full bg-slate-900/90 p-1 text-[11px] font-medium text-slate-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setMode("ai")}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition ${
                    mode === "ai"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-200/80 hover:text-white"
                  }`}
                >
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-lime-400 text-[9px] font-bold text-slate-900">
                    G
                  </span>
                  <span>AI plan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("map")}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition ${
                    mode === "map"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-200/80 hover:text-white"
                  }`}
                >
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-400 text-[9px] font-bold text-slate-900">
                    M
                  </span>
                  <span>Map & drop-off</span>
                </button>
              </div>
            </div>

            {mode === "ai" ? (
              <>
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
                  <div className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>Plan</span>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] text-lime-700">
                      Gemini · Fertilizer
                    </span>
                  </div>
                  <div className="space-y-3 text-sm text-slate-900">
                    {loading ? (
                      <div className="flex items-center gap-3 rounded-xl border border-lime-200 bg-white/70 px-3 py-2 text-xs text-slate-600">
                        <span className="inline-flex h-4 w-4 animate-spin rounded-full border border-lime-500 border-t-transparent" />
                        <span>Gemini is thinking about your scraps…</span>
                      </div>
                    ) : ideas.length ? (
                      selectedIdeaIndex === null ? (
                        <div className="space-y-3">
                          <p className="text-sm text-slate-600">
                            <span className="font-semibold text-slate-900">Plan ideas</span>{" "}
                            <span className="text-slate-400">(select a title or enter 1-4)</span>
                          </p>

                          <div className="flex items-center gap-2">
                            <input
                              value={pickNumber}
                              onChange={(e) => setPickNumber(e.target.value)}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="1"
                              className="h-9 w-16 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-900 outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-300"
                            />
                            <button
                              type="button"
                              onClick={() => selectIdeaByNumber(pickNumber)}
                              className="h-9 rounded-full bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                            >
                              Show
                            </button>
                          </div>

                          <div className="space-y-2">
                            {ideas.map((idea, idx) => (
                              <button
                                key={`${idea?.title ?? "idea"}-${idx}`}
                                type="button"
                                onClick={() => setSelectedIdeaIndex(idx)}
                                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-left shadow-sm transition hover:border-lime-200 hover:bg-lime-50/60"
                              >
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-slate-900">
                                    {idx + 1}. {idea?.title || "Untitled idea"}
                                  </div>
                                  {idea?.summary ? (
                                    <div className="mt-0.5 line-clamp-2 text-[12px] text-slate-500">
                                      {idea.summary}
                                    </div>
                                  ) : null}
                                </div>
                                <span className="ml-3 shrink-0 text-xs font-semibold text-lime-700">
                                  View
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Idea {selectedIdeaIndex + 1} of {ideas.length}
                              </div>
                              <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                                {ideas[selectedIdeaIndex]?.title || "Plan idea"}
                              </h2>
                              {ideas[selectedIdeaIndex]?.summary ? (
                                <p className="mt-1 text-sm text-slate-600">
                                  {ideas[selectedIdeaIndex].summary}
                                </p>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedIdeaIndex(null)}
                              className="shrink-0 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              All ideas
                            </button>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-white/70 p-3">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Steps
                              </div>
                              <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed text-slate-700">
                                {(ideas[selectedIdeaIndex]?.steps ?? []).map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ol>
                            </div>
                            <div className="space-y-3">
                              <div className="rounded-2xl border border-slate-200 bg-white/70 p-3">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                  Best for
                                </div>
                                <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-slate-700">
                                  {(ideas[selectedIdeaIndex]?.bestFor ?? []).map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                              {Array.isArray(ideas[selectedIdeaIndex]?.safetyNotes) &&
                              ideas[selectedIdeaIndex]?.safetyNotes?.length ? (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3">
                                  <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                                    Safety notes
                                  </div>
                                  <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-amber-800">
                                    {ideas[selectedIdeaIndex].safetyNotes.map((item, i) => (
                                      <li key={i}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )
                    ) : result ? (
                      <div className="whitespace-pre-wrap break-words text-slate-700 leading-relaxed">
                        {result}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Results show here.</p>
                    )}
                  </div>
                  <p className="mt-3 text-[10px] text-slate-400">Powered by Gemini.</p>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">
                    Find places that collect food waste.
                  </p>
                  <p>
                    Use the map to look for fertilizer companies, compost hubs, or community drop-off
                    points near you. This uses Google Maps search.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-[2fr,1.2fr]">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">
                      Your area or postcode
                    </label>
                    <input
                      type="text"
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                      placeholder="e.g. Bukit Bintang, Kuala Lumpur"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-600">What do you prefer?</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setMapMode("dropoff")}
                        className={`rounded-full px-3 py-1.5 border transition ${
                          mapMode === "dropoff"
                            ? "border-lime-500 bg-lime-50 text-lime-800"
                            : "border-slate-200 bg-white text-slate-700 hover:border-lime-300"
                        }`}
                      >
                        I can drop off
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapMode("pickup")}
                        className={`rounded-full px-3 py-1.5 border transition ${
                          mapMode === "pickup"
                            ? "border-lime-500 bg-lime-50 text-lime-800"
                            : "border-slate-200 bg-white text-slate-700 hover:border-lime-300"
                        }`}
                      >
                        They collect from me
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      The search keywords will change depending on your choice.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600">Map</p>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/80">
                    <iframe
                      title="Fertilizer and compost drop-off map"
                      src={(() => {
                        const baseQuery =
                          mapMode === "pickup"
                            ? "fertilizer company collects food waste"
                            : "food scrap compost drop-off point";
                        const fullQuery = locationQuery.trim()
                          ? `${baseQuery} near ${locationQuery.trim()}`
                          : `${baseQuery} near me`;
                        return `https://www.google.com/maps?q=${encodeURIComponent(
                          fullQuery,
                        )}&output=embed`;
                      })()}
                      className="h-72 w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Locations and opening hours come directly from Google Maps. Please double check
                    what materials each place accepts (household vs business, types of food waste).
                  </p>
                </div>
              </div>
            )}
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


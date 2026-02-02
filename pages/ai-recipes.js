import React from "react";
import { DM_Sans } from "next/font/google";
import { Card, CardBody, Button } from "@heroui/react";
import Link from "next/link";
import { splitCsv } from "@/lib/profiles";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function AiRecipesPage() {
  const [ingredients, setIngredients] = React.useState("");
  const [household, setHousehold] = React.useState("");
  const [filters, setFilters] = React.useState({
    halal: false,
    vegetarian: false,
    allergySafe: true,
  });
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState("");
  const [recipes, setRecipes] = React.useState([]);
  const [selectedRecipeIndex, setSelectedRecipeIndex] = React.useState(null);
  const [pickNumber, setPickNumber] = React.useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ingredients.trim() || loading) return;

    setLoading(true);
    setResult("");
    setRecipes([]);
    setSelectedRecipeIndex(null);
    setPickNumber("");

    // Normalize comma-separated ingredient tokens and apply simple typo corrections
    const typoCorrections = {
      spagetti: "spaghetti",
      spagettii: "spaghetti",
      tomatos: "tomato",
      tomates: "tomato",
      chiken: 'chicken',
    };

    const cleanedTokens = splitCsv(ingredients).map((t) => typoCorrections[t] ?? t);
    const cleanedIngredients = cleanedTokens.join(", ") || ingredients;

    try {
      const res = await fetch("/api/ai-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientsDescription: cleanedIngredients,
          householdDescription: household,
          filters,
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const data = await res.json();

      let nextRecipes = Array.isArray(data.recipes) ? data.recipes : [];
      let fallbackText = data.text ?? "";

      // If the server didn't manage to structure it, try to parse JSON here on the client.
      if (!nextRecipes.length && typeof fallbackText === "string" && fallbackText.trim()) {
        const cleaned = fallbackText
          .trim()
          .replace(/^```(?:json)?/i, "")
          .replace(/```$/i, "")
          .trim();

        if (cleaned.startsWith("{") && cleaned.includes('"recipes"')) {
          try {
            // First, try direct JSON.parse
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed?.recipes)) {
              const validRecipes = parsed.recipes.filter(
                (r) => r?.title && Array.isArray(r?.ingredients) && Array.isArray(r?.steps)
              );
              if (validRecipes.length) {
                nextRecipes = validRecipes;
                fallbackText = "";
              }
            }
          } catch (parseErr) {
            // If direct parse fails, try to fix incomplete JSON
            try {
              let jsonStr = cleaned;
              
              // Only try to fix if it looks incomplete (doesn't end properly)
              if (!jsonStr.trim().endsWith("}")) {
                // Count brackets/braces to close them
                const openBraces = (jsonStr.match(/{/g) || []).length;
                const closeBraces = (jsonStr.match(/}/g) || []).length;
                const openBrackets = (jsonStr.match(/\[/g) || []).length;
                const closeBrackets = (jsonStr.match(/\]/g) || []).length;
                
                // Close incomplete structures
                for (let i = 0; i < openBrackets - closeBrackets; i++) jsonStr += "]";
                for (let i = 0; i < openBraces - closeBraces; i++) jsonStr += "}";
              }

              const parsed = JSON.parse(jsonStr);
              if (Array.isArray(parsed?.recipes)) {
                const validRecipes = parsed.recipes.filter(
                  (r) => r?.title && Array.isArray(r?.ingredients) && Array.isArray(r?.steps)
                );
                if (validRecipes.length) {
                  nextRecipes = validRecipes;
                  fallbackText = "";
                }
              }
            } catch (secondErr) {
              // If all parsing fails, just show the raw text
              console.warn('Could not parse recipe JSON. Showing raw output.');
            }
          }
        }
      }

      setRecipes(nextRecipes);
      setResult(nextRecipes.length ? "" : fallbackText);
    } catch (err) {
      setResult(
        "I ran into a problem talking to Gemini. Please check your GEMINI_API_KEY and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleFilter(key) {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function selectRecipeByNumber(value) {
    const n = Number(String(value).trim());
    if (!Number.isFinite(n)) return;
    const idx = n - 1;
    if (idx < 0 || idx >= recipes.length) return;
    setSelectedRecipeIndex(idx);
  }

  return (
    <div
      className={`${dmSans.className} flex min-h-screen flex-col bg-gradient-to-b from-sky-50 via-white to-sky-100 text-slate-900`}
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

      <main className="flex flex-1 items-center justify-center px-4 pb-10 pt-2">
        <div className="w-full max-w-5xl space-y-8">
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
              AI recipe generator
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Turn what you have into meals.
            </h1>
            <p className="max-w-xl text-sm text-slate-500">
              Describe what&apos;s in your kitchen and we&apos;ll generate practical, low-waste
              recipe ideas tailored to your household.
            </p>
          </section>

          <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Card shadow="sm" className="border-none bg-white/80 backdrop-blur-md">
              <CardBody className="space-y-4 p-4 sm:p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="ingredients"
                      className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Ingredients you have
                    </label>
                    <textarea
                      id="ingredients"
                      rows={3}
                      className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300"
                      placeholder="E.g. 2 chicken breasts (expires tomorrow), bag of spinach, cooked rice, half onion, yogurt..."
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="household"
                      className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Household preferences (optional)
                    </label>
                    <textarea
                      id="household"
                      rows={2}
                      className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300"
                      placeholder="E.g. 2 adults, 1 child, no nuts, prefer mild spice, one person is vegetarian..."
                      value={household}
                      onChange={(e) => setHousehold(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-semibold text-slate-700">Filters</span>
                    <button
                      type="button"
                      onClick={() => toggleFilter("halal")}
                      className={`rounded-full px-3 py-1 ring-1 ring-inset ${
                        filters.halal
                          ? "bg-sky-600 text-white ring-sky-600"
                          : "bg-slate-50 text-slate-700 ring-slate-200"
                      }`}
                    >
                      Halal
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFilter("vegetarian")}
                      className={`rounded-full px-3 py-1 ring-1 ring-inset ${
                        filters.vegetarian
                          ? "bg-sky-600 text-white ring-sky-600"
                          : "bg-slate-50 text-slate-700 ring-slate-200"
                      }`}
                    >
                      Vegetarian
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFilter("allergySafe")}
                      className={`rounded-full px-3 py-1 ring-1 ring-inset ${
                        filters.allergySafe
                          ? "bg-sky-600 text-white ring-sky-600"
                          : "bg-slate-50 text-slate-700 ring-slate-200"
                      }`}
                    >
                      Allergy-safe
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[11px] text-slate-500">
                      Tip: mention which items are closest to expiry so the AI can prioritize them.
                    </p>
                    <Button
                      type="submit"
                      isDisabled={loading}
                      className="h-10 rounded-full bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                    >
                      {loading ? "Generating…" : "Generate recipes"}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>

            <Card shadow="sm" className="border-none bg-white/80 backdrop-blur-md">
              <CardBody className="flex h-full flex-col p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  <span>Ideas</span>
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] text-sky-600">
                    Gemini · Recipes
                  </span>
                </div>

                <div className="flex-1">
                  {recipes.length ? (
                    selectedRecipeIndex === null ? (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-600">
                          <span className="font-semibold text-slate-900">Recipe choices</span>{" "}
                          <span className="text-slate-400">(click a title or type 1–4)</span>
                        </p>

                        <div className="flex items-center gap-2">
                          <input
                            value={pickNumber}
                            onChange={(e) => setPickNumber(e.target.value)}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="1"
                            className="h-9 w-16 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300"
                          />
                          <button
                            type="button"
                            onClick={() => selectRecipeByNumber(pickNumber)}
                            className="h-9 rounded-full bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                          >
                            Show
                          </button>
                        </div>

                        <div className="space-y-2">
                          {recipes.map((r, idx) => (
                            <button
                              key={`${r?.title ?? "recipe"}-${idx}`}
                              type="button"
                              onClick={() => setSelectedRecipeIndex(idx)}
                              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-left shadow-sm transition hover:border-sky-200 hover:bg-sky-50/60"
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-900">
                                  {idx + 1}. {r?.title || "Untitled recipe"}
                                </div>
                                {Array.isArray(r?.why) && r.why.length ? (
                                  <div className="mt-0.5 line-clamp-2 text-[12px] text-slate-500">
                                    {r.why.slice(0, 2).join(" • ")}
                                  </div>
                                ) : null}
                              </div>
                              <span className="ml-3 shrink-0 text-xs font-semibold text-sky-700">
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
                              Recipe {selectedRecipeIndex + 1} of {recipes.length}
                            </div>
                            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                              {recipes[selectedRecipeIndex]?.title || "Recipe"}
                            </h2>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedRecipeIndex(null)}
                            className="shrink-0 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            All recipes
                          </button>
                        </div>

                        {Array.isArray(recipes[selectedRecipeIndex]?.why) &&
                        recipes[selectedRecipeIndex]?.why?.length ? (
                          <div className="rounded-2xl border border-slate-200 bg-white/70 p-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Why this works
                            </div>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-slate-700">
                              {recipes[selectedRecipeIndex].why.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-white/70 p-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Ingredients
                            </div>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-slate-700">
                              {(recipes[selectedRecipeIndex]?.ingredients ?? []).map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white/70 p-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Steps
                            </div>
                            <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed text-slate-700">
                              {(recipes[selectedRecipeIndex]?.steps ?? []).map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      </div>
                    )
                  ) : result ? (
                    <div className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-slate-900">
                      {result}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Your recipes will appear here after you generate them.
                    </p>
                  )}
                </div>

                <p className="mt-3 text-[11px] text-slate-400">
                  Powered by Gemini. Always double-check cooking times and food safety if using
                  items close to expiry.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}


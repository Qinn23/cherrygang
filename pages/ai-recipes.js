import React from "react";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ingredients.trim() || loading) return;

    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/ai-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientsDescription: ingredients,
          householdDescription: household,
          filters,
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

  function toggleFilter(key) {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div
      className={`${geistSans.className} ${geistMono.className} flex min-h-screen flex-col bg-slate-100 text-slate-900`}
    >
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              AI recipe generator
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              Turn what you have into meals
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Describe what&apos;s in your kitchen and we&apos;ll generate practical ideas that
              reduce food waste.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6 gap-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4"
        >
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
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
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
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
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
                  ? "bg-emerald-600 text-white ring-emerald-600"
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
                  ? "bg-emerald-600 text-white ring-emerald-600"
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
                  ? "bg-emerald-600 text-white ring-emerald-600"
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
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center rounded-full bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Generating…" : "Generate recipes"}
            </button>
          </div>
        </form>

        <section className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Ideas
          </div>
          <div className="prose prose-sm max-w-none text-slate-900 prose-headings:mt-4 prose-headings:mb-2 prose-p:my-1 prose-ul:my-1">
            {result ? (
              // Render as plain text; the prose styles will make simple markdown look good.
              <pre className="whitespace-pre-wrap break-words text-sm font-normal text-slate-900">
                {result}
              </pre>
            ) : (
              <p className="text-sm text-slate-500">
                Your recipes will appear here after you generate them.
              </p>
            )}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Powered by Gemini. Always double-check cooking times and food safety if using items
            close to expiry.
          </p>
        </section>
      </main>
    </div>
  );
}


import React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { AlertsPanel } from "@/components/AlertsPanel";
import { DashboardStatCard } from "@/components/DashboardStatCard";
import { RecipeCard } from "@/components/RecipeCard";
import { DinerSelector } from "@/components/DinerSelector";
import { useProfiles } from "@/components/ProfilesContext";
import { normalizeToken } from "@/lib/profiles";
import { recommendRecipesWithGemini } from "@/lib/geminiRecommender";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysUntil(dateISO, now = new Date()) {
  const a = startOfDay(now).getTime();
  const b = startOfDay(new Date(dateISO)).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function iconLeaf() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M20 4c-6 0-10.5 2-13.2 5.3C4.1 12.6 4 16.8 4 20c3.2 0 7.4-.1 10.7-2.8C18 14.5 20 10 20 4Z"
        className="stroke-current"
        strokeWidth="2"
      />
      <path
        d="M9 15c2-2 5-4 9-5"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function iconClock() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z"
        className="stroke-current"
        strokeWidth="2"
      />
      <path
        d="M12 7v6l4 2"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function iconJar() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M8 3h8M9 3v3m6-3v3"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 6h10v3.5c0 .6.2 1.1.6 1.5l.7.7c.5.5.7 1.2.7 1.9V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6.4c0-.7.3-1.4.8-1.9l.7-.7c.3-.4.5-.9.5-1.5V6Z"
        className="stroke-current"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function iconSpark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M12 2l1.2 5.1L18 9l-4.8 1.9L12 16l-1.2-5.1L6 9l4.8-1.9L12 2Z"
        className="stroke-current"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M20 14l.7 2.7L23 18l-2.3 1.3L20 22l-.7-2.7L17 18l2.3-1.3L20 14Z"
        className="stroke-current"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  const { profiles, selectedDinerIds } = useProfiles();
  // Mock pantry + insights (replace with API calls later)
  const ingredients = [
    { name: "Spinach", qty: "120 g", expiresOn: "2026-01-28", category: "Produce" },
    { name: "Greek Yogurt", qty: "500 g", expiresOn: "2026-01-29", category: "Dairy" },
    { name: "Cherry Tomatoes", qty: "250 g", expiresOn: "2026-01-30", category: "Produce" },
    { name: "Tortillas", qty: "8 pcs", expiresOn: "2026-02-02", category: "Bakery" },
    { name: "Cooked Rice", qty: "300 g", expiresOn: "2026-01-27", category: "Prepared" },
    { name: "Chicken Breast", qty: "400 g", expiresOn: "2026-01-26", category: "Protein" },
  ];

  const recipes = [
    {
      id: "r1",
      name: "Spinach Yogurt Wraps",
      timeMins: 15,
      difficulty: "Easy",
      matchPct: 92,
      usesSoon: ["Spinach", "Greek Yogurt", "Tortillas"],
      missing: ["Lemon"],
      tags: ["dairy"],
    },
    {
      id: "r2",
      name: "Cherry Tomato Rice Bowl",
      timeMins: 20,
      difficulty: "Easy",
      matchPct: 86,
      usesSoon: ["Cooked Rice", "Cherry Tomatoes", "Spinach"],
      missing: ["Feta"],
      tags: ["dairy"],
    },
    {
      id: "r3",
      name: "Quick Chicken Stir-Fry",
      timeMins: 25,
      difficulty: "Medium",
      matchPct: 78,
      usesSoon: ["Chicken Breast", "Spinach"],
      missing: ["Soy Sauce", "Garlic"],
      tags: ["soy"],
    },
    {
      id: "r4",
      name: "Peanut Noodle Salad",
      timeMins: 18,
      difficulty: "Easy",
      matchPct: 74,
      usesSoon: ["Spinach"],
      missing: ["Noodles", "Peanut Butter"],
      tags: ["nuts", "gluten"],
    },
  ];

  const selectedDiners = profiles.filter((p) => selectedDinerIds.includes(p.id));

  const hardAvoid = new Set();
  const softPrefer = new Set();
  const softAvoid = new Set();

  function pushAll(set, arr) {
    for (const x of arr ?? []) set.add(normalizeToken(x));
  }

  for (const p of selectedDiners) {
    pushAll(hardAvoid, p.allergies);
    pushAll(hardAvoid, p.intolerances);
    pushAll(softPrefer, p.preferredFoods);
    pushAll(softAvoid, p.dislikedFoods);
  }

  // Map common labels -> recipe tags
  const tagMap = {
    lactose: "dairy",
    dairy: "dairy",
    milk: "dairy",
    nuts: "nuts",
    peanut: "nuts",
    gluten: "gluten",
    wheat: "gluten",
    soy: "soy",
    shellfish: "shellfish",
    fish: "fish",
    eggs: "eggs",
  };

  const hardAvoidTags = new Set(
    Array.from(hardAvoid, (x) => tagMap[x] ?? x).filter(Boolean)
  );

  function scoreRecipe(r) {
    const tags = (r.tags ?? []).map(normalizeToken);
    let score = r.matchPct ?? 0;
    for (const t of tags) {
      if (softPrefer.has(t)) score += 8;
      if (softAvoid.has(t)) score -= 8;
    }
    return score;
  }

  const filteredRecipes = recipes
    .filter((r) => {
      const tags = new Set((r.tags ?? []).map(normalizeToken));
      for (const t of hardAvoidTags) if (tags.has(t)) return false;
      return true;
    })
    .map((r) => ({ ...r, computedScore: scoreRecipe(r) }))
    .sort((a, b) => b.computedScore - a.computedScore);

  // Gemini stub (UI preview)
  const diners = selectedDiners;
  const [aiPreview, setAiPreview] = React.useState(null);
  const [aiLoading, setAiLoading] = React.useState(false);

  async function runAiPreview() {
    setAiLoading(true);
    try {
      const res = await recommendRecipesWithGemini({
        pantryItems: ingredients,
        diners,
        candidateRecipes: recipes,
      });
      setAiPreview(res);
    } finally {
      setAiLoading(false);
    }
  }

  const expiringWindowDays = 3;
  const now = new Date();
  const withDeltas = ingredients.map((i) => ({
    ...i,
    daysLeft: daysUntil(i.expiresOn, now),
  }));

  const expired = withDeltas.filter((i) => i.daysLeft < 0);
  const expiringSoon = withDeltas
    .filter((i) => i.daysLeft >= 0 && i.daysLeft <= expiringWindowDays)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const alerts = [
    ...expired.map((i) => ({
      id: `expired-${i.name}`,
      severity: "danger",
      title: `${i.name} is expired`,
      description: `Expired ${Math.abs(i.daysLeft)} day(s) ago — consider discarding or logging as waste.`,
    })),
    ...expiringSoon.slice(0, 3).map((i) => ({
      id: `soon-${i.name}`,
      severity: "warning",
      title: `${i.name} expires soon`,
      description:
        i.daysLeft === 0
          ? "Expires today — prioritize in meals."
          : `Expires in ${i.daysLeft} day(s) — add to a recipe tonight.`,
    })),
    {
      id: "tip-freeze",
      severity: "info",
      title: "Tip: freeze extras",
      description: "Freeze spinach or cooked chicken portions to extend shelf life.",
    },
  ];

  const foodSavedKg = 3.4;
  const co2ReducedKg = 8.9;

  return (
    <div
      className={`${geistSans.className} ${geistMono.className} min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-emerald-50 font-sans text-zinc-900`}
    >
      <header className="border-b border-amber-200/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-6">
          <div>
            <p className="text-sm font-medium text-zinc-700">
              Smart Pantry
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Dashboard
            </h1>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-900 ring-1 ring-inset ring-emerald-500/20">
              {expiringSoon.length} expiring soon
            </div>
            <div className="rounded-full bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-900 ring-1 ring-inset ring-amber-500/20">
              {ingredients.length} items tracked
            </div>
            <Link
              href="/profiles"
              className="rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-zinc-800 ring-1 ring-inset ring-amber-200/70 hover:bg-white"
            >
              Profiles
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            title="Ingredients expiring"
            value={`${expiringSoon.length + expired.length}`}
            subtext={`${expired.length} expired • next ${Math.min(
              expiringWindowDays,
              7
            )} days`}
            accent={expired.length ? "rose" : "amber"}
            icon={iconClock()}
          />
          <DashboardStatCard
            title="Suggested recipes"
            value={`${recipes.length}`}
            subtext="Based on what you have + what expires soon"
            accent="sky"
            icon={iconSpark()}
          />
          <DashboardStatCard
            title="Food saved"
            value={`${foodSavedKg.toFixed(1)} kg`}
            subtext="Saved from waste this month (estimate)"
            accent="emerald"
            icon={iconJar()}
          />
          <DashboardStatCard
            title="CO₂ reduced"
            value={`${co2ReducedKg.toFixed(1)} kg`}
            subtext="Avoided emissions from prevented waste"
            accent="emerald"
            icon={iconLeaf()}
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <DinerSelector />
            </div>

            <div className="flex items-end justify-between gap-4">
              <h2 className="text-base font-semibold tracking-tight text-zinc-900">
                Suggested recipes
              </h2>
              <p className="text-sm text-zinc-700">
                Prioritizing items expiring soon
              </p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {filteredRecipes.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <AlertsPanel alerts={alerts} />

            <section className="rounded-2xl border border-amber-200/60 bg-white/80 p-5 shadow-sm ring-1 ring-inset ring-white/50 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold tracking-tight text-zinc-900">
                  Gemini recommendations (preview)
                </h2>
                <button
                  type="button"
                  onClick={runAiPreview}
                  disabled={aiLoading}
                  className="rounded-full bg-sky-500/15 px-3 py-1 text-sm font-semibold text-sky-900 ring-1 ring-inset ring-sky-500/20 hover:bg-sky-500/20 disabled:opacity-60"
                >
                  {aiLoading ? "Thinking…" : "Generate"}
                </button>
              </div>

              <p className="mt-1 text-sm text-zinc-700">
                This is a stub now. Later we’ll swap this to a real Gemini API
                call.
              </p>

              <div className="mt-4 space-y-2">
                {!aiPreview ? (
                  <div className="rounded-xl border border-dashed border-amber-200/70 bg-white/60 p-4 text-sm text-zinc-700">
                    Click “Generate” to see how diner selection affects AI
                    suggestions.
                  </div>
                ) : (
                  aiPreview.recommendations.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-amber-200/60 bg-amber-50/60 p-4"
                    >
                      <p className="font-semibold text-zinc-900">{r.name}</p>
                      <p className="mt-1 text-sm text-zinc-700">{r.reason}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-amber-200/60 bg-white/80 p-5 shadow-sm ring-1 ring-inset ring-white/50 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold tracking-tight text-zinc-900">
                  Expiring overview
                </h2>
                <span className="text-sm text-zinc-600">
                  Next {expiringWindowDays} days
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {[...expired, ...expiringSoon].slice(0, 6).map((i) => {
                  const isExpired = i.daysLeft < 0;
                  const pill =
                    isExpired
                      ? "bg-rose-500/10 text-rose-900 ring-rose-500/20"
                      : i.daysLeft === 0
                        ? "bg-amber-500/15 text-amber-900 ring-amber-500/20"
                        : "bg-emerald-500/15 text-emerald-900 ring-emerald-500/20";

                  const label =
                    isExpired
                      ? `expired ${Math.abs(i.daysLeft)}d ago`
                      : i.daysLeft === 0
                        ? "expires today"
                        : `in ${i.daysLeft}d`;

                  return (
                    <div
                      key={`${i.name}-${i.expiresOn}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/60 bg-amber-50/60 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-900">
                          {i.name}
                        </p>
                        <p className="mt-0.5 text-sm text-zinc-700">
                          {i.qty} • {i.category}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${pill}`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}

                {expired.length + expiringSoon.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-amber-200/70 bg-white/60 p-4 text-sm text-zinc-700">
                    Nothing expiring soon. Nice work.
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

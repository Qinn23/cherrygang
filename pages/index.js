import React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/router";
import { AlertsPanel } from "@/components/AlertsPanel";
import { DashboardStatCard } from "@/components/DashboardStatCard";
import { RecipeCard } from "@/components/RecipeCard";
import { DinerSelector } from "@/components/DinerSelector";
import { useProfiles } from "@/components/ProfilesContext";
import { useAuth } from "@/components/AuthContext";
import { logout } from "@/lib/auth";
import { normalizeToken } from "@/lib/profiles";
import { recommendRecipesWithGemini } from "@/lib/geminiRecommender";
import {
  ingredients as sampleIngredients,
  computeWithDeltas,
  getExpired,
  getExpiringSoon,
} from "@/lib/expiring";

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
  const router = useRouter();
  const { isAuthenticated, profile, user } = useAuth();
  const { profiles, selectedDinerIds } = useProfiles();
  // Use shared sample pantry items (replace with API calls later)
  const ingredients = sampleIngredients;

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
  const withDeltas = computeWithDeltas(ingredients, now);
  const expired = getExpired(ingredients, now);
  const expiringSoon = getExpiringSoon(ingredients, expiringWindowDays, now);

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
      className={`${geistSans.className} ${geistMono.className} min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50`}
    >
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-shrink-0 border-r-2 border-macaron-lemon bg-gradient-to-b from-white via-macaron-lemon/5 to-macaron-lavender/10 px-5 py-6 lg:flex lg:flex-col">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-macaron-lemon text-sm font-semibold text-macaron-lemon-dark shadow-macaron-md">
                SP
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-macaron-lemon-dark">
                  Smart Pantry
                </p>
                <p className="text-sm font-semibold text-macaron-lemon-dark">Household</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <p className="text-xs text-macaron-lemon-dark truncate">{profile?.name || user?.email}</p>
                  <Link
                    href="/edit-profile"
                    className="rounded px-2 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition text-center"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={async () => {
                      await logout();
                      router.push("/login");
                    }}
                    className="rounded px-2 py-1 text-xs font-medium text-white bg-macaron-pink hover:bg-macaron-pink/90 transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded px-3 py-1.5 text-xs font-medium text-white bg-macaron-lemon hover:bg-macaron-lemon/90 transition text-center"
                >
                  Login
                </Link>
              )}
            </div>
          </div>

          <nav className="mt-8 space-y-1 text-sm">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-macaron-lavender-dark">
              Overview
            </p>
            <Link
              href="/"
              className="mt-1 flex items-center justify-between rounded-lg bg-gradient-macaron-pink px-3 py-2 text-sm font-medium text-white shadow-macaron-pink transition-all hover:shadow-lg"
            >
              <span>Dashboard</span>
            </Link>
            <Link
              href="/ai-chat"
              className="mt-1 flex items-center justify-between rounded-lg px-3 py-2 text-sm text-macaron-pink-dark hover:bg-macaron-lavender/20 transition-colors"
            >
              <span>AI assistant</span>
            </Link>

            <p className="mt-6 px-2 text-xs font-semibold uppercase tracking-wide text-macaron-lavender-dark">
              Pantry
            </p>
            <Link
              href="/add-food"
              className="mt-1 flex items-center justify-between rounded-lg px-3 py-2 text-sm text-macaron-pink-dark hover:bg-macaron-mint/20 transition-colors"
            >
              <span>Add food</span>
            </Link>
            <Link
              href="/recipes"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-macaron-pink-dark hover:bg-macaron-sky/20 transition-colors"
            >
              <span>Recipes</span>
            </Link>
            <Link
              href="/ai-recipes"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-macaron-pink-dark hover:bg-macaron-peach/20 transition-colors"
            >
              <span>AI recipe generator</span>
            </Link>

            <p className="mt-6 px-2 text-xs font-semibold uppercase tracking-wide text-macaron-lavender-dark">
              People & tips
            </p>
            <Link
              href="/profiles"
              className="mt-1 flex items-center justify-between rounded-lg px-3 py-2 text-sm text-macaron-pink-dark hover:bg-macaron-lemon/20 transition-colors"
            >
              <span>Family profiles</span>
            </Link>
            <Link
              href="/community"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-macaron-pink-dark hover:bg-macaron-rose/20 transition-colors"
            >
              <span>Community life hacks</span>
            </Link>
            <Link
              href="/fertilizer"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-macaron-pink-dark hover:bg-macaron-mint/20 transition-colors"
            >
              <span>Fertilizer tips</span>
            </Link>
          </nav>

          <div className="mt-auto pt-8 text-xs text-macaron-lavender-dark">
            <p>Food waste dashboard prototype</p>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex-1">
          {/* Top bar */}
          <header className="border-b-2 border-macaron-lavender bg-gradient-macaron-lavender backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-macaron-lavender-dark">
                  Dashboard
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-macaron-lavender-dark">
                  Today in your kitchen
                </h1>
                <p className="mt-1 text-xs text-macaron-lavender-dark">
                  See what&apos;s expiring, what to cook, and how your household is reducing waste.
                </p>
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <div className="rounded-full bg-gradient-macaron-mint px-3 py-1 text-xs font-medium text-macaron-mint-dark ring-2 ring-inset ring-macaron-mint">
                  {expiringSoon.length} expiring soon
                </div>
                <div className="rounded-full bg-gradient-macaron-sky px-3 py-1 text-xs font-medium text-macaron-sky-dark ring-2 ring-inset ring-macaron-sky">
                  {ingredients.length} items tracked
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-8">
            {/* Top stats */}
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Link href="/expiring" className="block">
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
              </Link>
              <Link href="/suggested-recipes" className="block">
                <DashboardStatCard
                  title="Suggested recipes"
                  value={`${recipes.length}`}
                  subtext="Based on what you have + what expires soon"
                  accent="sky"
                  icon={iconSpark()}
                />
              </Link>
              <Link href="/food-save" className="block">
                <DashboardStatCard
                  title="Food saved"
                  value={`${foodSavedKg.toFixed(1)} kg`}
                  subtext="Saved from waste this month (estimate)"
                  accent="emerald"
                  icon={iconJar()}
                />
              </Link>
              <DashboardStatCard
                title="CO₂ reduced"
                value={`${co2ReducedKg.toFixed(1)} kg`}
                subtext="Avoided emissions from prevented waste"
                accent="emerald"
                icon={iconLeaf()}
              />
            </section>

            {/* Main grid */}
            <section className="grid gap-6 lg:grid-cols-3">
              {/* Left: diners + recipes */}
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl border-2 border-macaron-pink bg-white/90 p-5 shadow-macaron-md hover:shadow-macaron-lg transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold tracking-tight text-macaron-pink-dark">
                      Who are we cooking for?
                    </h2>
                    <p className="text-xs text-macaron-lavender-dark">
                      Family profiles adjust allergies and preferences automatically.
                    </p>
                  </div>
                  <div className="mt-3">
                    <DinerSelector />
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-macaron-mint bg-white/90 p-5 shadow-macaron-md hover:shadow-macaron-lg transition-all">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight text-macaron-mint-dark">
                        Suggested recipes
                      </h2>
                      <p className="mt-1 text-xs text-macaron-lavender-dark">
                        Prioritizing ingredients that are expiring soon and your diners&apos; needs.
                      </p>
                    </div>
                    <Link
                      href="/recipes"
                      className="hidden px-4 py-2 rounded-full font-semibold text-white bg-gradient-macaron-mint hover:shadow-lg transition-all sm:inline-flex"
                    >
                      View all recipes
                    </Link>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {filteredRecipes.map((r) => (
                      <RecipeCard key={r.id} recipe={r} />
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-macaron-lavender-dark">
                    <p>
                      Recipes generated from your current pantry and what expires first.
                    </p>
                    <Link
                      href="/ai-recipes"
                      className="inline-flex items-center gap-1 rounded-full bg-gradient-macaron-sky px-3 py-1 font-medium text-white ring-2 ring-inset ring-macaron-sky hover:shadow-lg transition-all"
                    >
                      Try AI recipe generator
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right: alerts + AI + expiring list */}
              <div className="space-y-6">
                <div className="rounded-2xl border-2 border-macaron-pink bg-white/90 p-5 shadow-macaron-md hover:shadow-macaron-lg transition-all">
                  <h2 className="text-sm font-semibold tracking-tight text-macaron-pink-dark">
                    Alerts
                  </h2>
                  <p className="mt-1 text-xs text-macaron-lavender-dark">
                    Expired items, urgent ingredients, and quick food-saving tips.
                  </p>
                  <div className="mt-4">
                    <AlertsPanel alerts={alerts} />
                  </div>
                </div>

                <section className="rounded-2xl border-2 border-macaron-sky bg-white/90 p-5 shadow-macaron-md hover:shadow-macaron-lg transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight text-macaron-sky-dark">
                        Gemini recommendations (preview)
                      </h2>
                      <p className="mt-1 text-xs text-macaron-lavender-dark">
                        Soon this will generate tailored meal plans for your household.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={runAiPreview}
                      disabled={aiLoading}
                      className="px-4 py-2 rounded-full font-semibold text-white bg-gradient-macaron-mint hover:shadow-lg transition-all disabled:opacity-60"
                    >
                      {aiLoading ? "Thinking…" : "Generate"}
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {!aiPreview ? (
                      <div className="rounded-xl border-2 border-dashed border-macaron-sky bg-macaron-sky/10 p-4 text-xs text-macaron-sky-dark">
                        Select diners, then click &quot;Generate&quot; to see how AI will adapt to
                        your household.
                      </div>
                    ) : (
                      aiPreview.recommendations.map((r) => (
                        <div
                          key={r.id}
                          className="rounded-xl border-2 border-macaron-sky bg-gradient-macaron-sky p-4"
                        >
                          <p className="text-sm font-semibold text-white">{r.name}</p>
                          <p className="mt-1 text-xs text-white/90">{r.reason}</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border-2 border-macaron-peach bg-white/90 p-5 shadow-macaron-md hover:shadow-macaron-lg transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-sm font-semibold tracking-tight text-macaron-peach-dark">
                      Expiring overview
                    </h2>
                    <span className="text-xs text-macaron-lavender-dark">
                      Next {expiringWindowDays} days
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {[...expired, ...expiringSoon].slice(0, 6).map((i) => {
                      const isExpired = i.daysLeft < 0;
                      const pill =
                        isExpired
                          ? "bg-gradient-macaron-pink text-white ring-macaron-pink"
                          : i.daysLeft === 0
                            ? "bg-gradient-macaron-peach text-white ring-macaron-peach"
                            : "bg-gradient-macaron-mint text-white ring-macaron-mint";

                      const label =
                        isExpired
                          ? `expired ${Math.abs(i.daysLeft)}d ago`
                          : i.daysLeft === 0
                            ? "expires today"
                            : `in ${i.daysLeft}d`;

                      return (
                        <div
                          key={`${i.name}-${i.expiresOn}`}
                          className="flex items-center justify-between gap-3 rounded-xl border-2 border-macaron-peach/30 bg-macaron-peach/10 px-4 py-3 hover:border-macaron-peach transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-macaron-peach-dark">
                              {i.name}
                            </p>
                            <p className="mt-0.5 text-xs text-macaron-lavender-dark">
                              {i.qty} • {i.category}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ring-2 ring-inset ${pill}`}
                          >
                            {label}
                          </span>
                        </div>
                      );
                    })}

                    {expired.length + expiringSoon.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-macaron-peach bg-macaron-peach/10 p-4 text-xs text-macaron-peach-dark">
                        Nothing expiring soon. You&apos;re on top of things.
                      </div>
                    ) : null}
                  </div>
                </section>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

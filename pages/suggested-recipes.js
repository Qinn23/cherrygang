import React from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { RecipeCard } from "@/components/RecipeCard";
import { DinerSelector } from "@/components/DinerSelector";
import { useProfiles } from "@/components/ProfilesContext";
import { normalizeToken } from "@/lib/profiles";
import {
  ingredients as sampleIngredients,
  computeWithDeltas,
  getExpired,
  getExpiringSoon,
} from "@/lib/expiring";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

function scoreRecipe(r, softPrefer, softAvoid) {
  const tags = (r.tags ?? []).map(normalizeToken);
  let score = r.matchPct ?? 0;
  for (const t of tags) {
    if (softPrefer.has(t)) score += 8;
    if (softAvoid.has(t)) score -= 8;
  }
  return score;
}

export default function SuggestedRecipesPage() {
  const { profiles, selectedDinerIds } = useProfiles();
  const ingredients = sampleIngredients;

  const recipes = [
    { id: "r1", name: "Spinach Yogurt Wraps", timeMins: 15, difficulty: "Easy", matchPct: 92, usesSoon: ["Spinach", "Greek Yogurt", "Tortillas"], missing: ["Lemon"], tags: ["dairy"] },
    { id: "r2", name: "Cherry Tomato Rice Bowl", timeMins: 20, difficulty: "Easy", matchPct: 86, usesSoon: ["Cooked Rice", "Cherry Tomatoes", "Spinach"], missing: ["Feta"], tags: ["dairy"] },
    { id: "r3", name: "Quick Chicken Stir-Fry", timeMins: 25, difficulty: "Medium", matchPct: 78, usesSoon: ["Chicken Breast", "Spinach"], missing: ["Soy Sauce", "Garlic"], tags: ["soy"] },
    { id: "r4", name: "Peanut Noodle Salad", timeMins: 18, difficulty: "Easy", matchPct: 74, usesSoon: ["Spinach"], missing: ["Noodles", "Peanut Butter"], tags: ["nuts", "gluten"] },
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

  const hardAvoidTags = new Set(Array.from(hardAvoid, (x) => tagMap[x] ?? x).filter(Boolean));

  const filteredRecipes = recipes
    .filter((r) => {
      const tags = new Set((r.tags ?? []).map(normalizeToken));
      for (const t of hardAvoidTags) if (tags.has(t)) return false;
      return true;
    })
    .map((r) => ({ ...r, computedScore: scoreRecipe(r, softPrefer, softAvoid) }))
    .sort((a, b) => b.computedScore - a.computedScore);

  const now = new Date();
  const expiringWindowDays = 3;
  const expired = getExpired(ingredients, now);
  const expiringSoon = getExpiringSoon(ingredients, expiringWindowDays, now);

  return (
    <div className={`${geistSans.className} ${geistMono.className} min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50`}>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-macaron-lavender-dark">Suggested recipes</h1>
            <p className="mt-1 text-xs text-macaron-lavender-dark">Recipes prioritized by expiring ingredients and family preferences.</p>
          </div>
          <Link href="/" className="text-sm text-macaron-pink-dark hover:underline">Back</Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {filteredRecipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>

        <div className="mt-8 rounded-2xl border-2 border-macaron-peach bg-white/90 p-5 shadow-macaron-md">
          <h2 className="text-sm font-semibold text-macaron-peach-dark">Expiring overview</h2>
          <p className="mt-2 text-xs text-macaron-lavender-dark">Next {expiringWindowDays} days • {expired.length + expiringSoon.length} items</p>
        </div>
      </main>
    </div>
  );
}

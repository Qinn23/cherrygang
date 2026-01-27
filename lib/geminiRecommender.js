import { normalizeToken } from "@/lib/profiles";

// Stub for Gemini integration.
// Later: replace with an API route that calls Gemini and returns structured recipe recommendations.
export async function recommendRecipesWithGemini({
  pantryItems,
  diners,
  candidateRecipes,
}) {
  // Basic deterministic fallback behavior:
  // - if any selected diner has hard avoids, prefer recipes that do NOT include those tags
  // - otherwise return top by matchPct
  const hardAvoid = new Set();
  for (const d of diners ?? []) {
    for (const a of d.allergies ?? []) hardAvoid.add(normalizeToken(a));
    for (const i of d.intolerances ?? []) hardAvoid.add(normalizeToken(i));
  }

  const tagMap = { lactose: "dairy", peanut: "nuts" };
  const hardAvoidTags = new Set(
    Array.from(hardAvoid, (x) => tagMap[x] ?? x).filter(Boolean)
  );

  const safe = (candidateRecipes ?? []).filter((r) => {
    const tags = new Set((r.tags ?? []).map(normalizeToken));
    for (const t of hardAvoidTags) if (tags.has(t)) return false;
    return true;
  });

  const ranked = safe
    .slice()
    .sort((a, b) => (b.matchPct ?? 0) - (a.matchPct ?? 0))
    .slice(0, 5);

  return {
    mode: "stub",
    promptPreview: {
      diners: diners?.map((d) => ({
        name: d.name,
        allergies: d.allergies,
        intolerances: d.intolerances,
        preferredFoods: d.preferredFoods,
        dislikedFoods: d.dislikedFoods,
      })),
      pantryItems: pantryItems?.map((p) => p.name),
    },
    recommendations: ranked.map((r) => ({
      id: r.id,
      name: r.name,
      reason:
        "Stub suggestion (replace with Gemini). Filtered using selected diners’ preferences.",
    })),
  };
}


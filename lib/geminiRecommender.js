import { normalizeToken } from "@/lib/profiles";

// Call the Gemini-backed API route from the client.
// Falls back to a simple deterministic ranking if the API call fails.
export async function recommendRecipesWithGemini({
  pantryItems,
  diners,
  candidateRecipes,
}) {
  try {
    const res = await fetch("/api/gemini-recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pantryItems,
        diners,
        candidateRecipes,
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini API route failed with status ${res.status}`);
    }

    const data = await res.json();
    if (data?.mode === "gemini" && Array.isArray(data.recommendations)) {
      return data;
    }
    // If response is unexpected, fall through to stub.
  } catch (e) {
    // Swallow and fall back to stub.
    console.error("Falling back to stub Gemini recommender:", e);
  }

  // --- Fallback stub behaviour (previous implementation) ---
  const hardAvoid = new Set();
  for (const d of diners ?? []) {
    for (const a of d.allergies ?? []) hardAvoid.add(normalizeToken(a));
    for (const i of d.intolerances ?? []) hardAvoid.add(normalizeToken(i));
  }

  const tagMap = { lactose: "dairy", peanut: "nuts" };
  const hardAvoidTags = new Set(
    Array.from(hardAvoid, (x) => tagMap[x] ?? x).filter(Boolean),
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
    mode: "stub-fallback",
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
        "Fallback suggestion (Gemini unavailable). Filtered using selected diners’ preferences.",
    })),
  };
}



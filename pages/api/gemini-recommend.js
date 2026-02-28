import { normalizeToken } from "@/lib/profiles";

// API route that calls the Gemini API to generate structured recipe recommendations.
// Expects POST body: { pantryItems, diners, candidateRecipes }
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured on the server",
    });
  }

  const { pantryItems = [], diners = [], candidateRecipes = [] } = req.body ?? {};

  // Flatten diners into something easy for the model to reason about.
  const simplifiedDiners = diners.map((d) => ({
    name: d.name,
    allergies: d.allergies ?? [],
    intolerances: d.intolerances ?? [],
    preferredFoods: d.preferredFoods ?? [],
    dislikedFoods: d.dislikedFoods ?? [],
  }));

  const prompt = `
You are an AI assistant that helps households reduce food waste.

You will receive:
- A list of pantry items with names, quantities and expiry dates.
- A list of diners (family members) with allergies, intolerances, preferred foods and disliked foods.
- A list of candidate recipes that the application already knows about, including which ingredients each recipe uses and any dietary tags.

Your job:
- Rank and select up to 5 recipes that best help reduce food waste while respecting allergies/intolerances.
- Prefer recipes that:
  - Use ingredients that are already expired or expiring soon.
  - Match diners' preferences.
  - Avoid any allergens or intolerances.
- For each recommended recipe, provide:
  - id: the recipe id from the candidate list
  - name: the recipe name from the candidate list
  - reason: a single short sentence explaining why this is a good choice (for example: "Uses spinach that expires today and avoids dairy for Ali.")

Important:
- Only recommend recipes that exist in the candidateRecipes list.
- NEVER recommend something that conflicts with any diner allergy or intolerance.
- Reply with STRICT JSON only. No markdown, no code fences, no additional commentary.
- The JSON shape must be:
  {
    "recommendations": [
      { "id": "r1", "name": "Example", "reason": "short explanation" }
    ]
  }
`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: JSON.stringify(
              {
                instructions: prompt,
                pantryItems,
                diners: simplifiedDiners,
                candidateRecipes,
              },
              null,
              2,
            ),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 512,
    },
  };

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=" +
        encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({
        error: "Gemini API request failed",
        details: errorText,
      });
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n");

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // If the model responded with surrounding text, try to extract a JSON object.
      const match = text && text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw e;
      }
    }

    const recommendations = Array.isArray(parsed?.recommendations)
      ? parsed.recommendations
      : [];

    // Basic guard: if the model returned nothing usable, fall back to empty list.
    const safeRecommendations = recommendations
      .filter((r) => r && r.id && r.name)
      .map((r) => ({
        id: String(r.id),
        name: String(r.name),
        reason:
          typeof r.reason === "string"
            ? r.reason
            : "AI-suggested recipe based on current pantry and diners.",
      }));

    return res.status(200).json({
      mode: "gemini",
      recommendations: safeRecommendations,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to call Gemini API",
      details: error?.message ?? String(error),
    });
  }
}


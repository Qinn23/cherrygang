// Free-form AI recipe generator using Gemini.
// Expects POST { ingredientsDescription: string, householdDescription?: string, filters?: { halal?: boolean, vegetarian?: boolean, allergySafe?: boolean } }
// Returns { recipes?: Array<{ title: string, why?: string[], ingredients?: string[], steps?: string[] }>, text?: string }
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

  const { ingredientsDescription = "", householdDescription = "", filters = {} } =
    req.body ?? {};

  const flags = [];
  if (filters.halal) flags.push("halal-friendly");
  if (filters.vegetarian) flags.push("vegetarian");
  if (filters.allergySafe) flags.push("avoid common allergens");

  const schemaHint = `Return ONLY valid JSON (no markdown, no code fences) with this exact shape:
{
  "recipes": [
    {
      "title": "string",
      "why": ["string", "string"],
      "ingredients": ["string", "..."],
      "steps": ["string", "..."]
    }
  ]
}
Rules:
- Always return exactly 4 recipes.
- Keep titles short (max 8 words).
- "why" must be 2–3 short bullets.
- "steps" must be 3–6 concise steps.
- Prefer ingredients the user listed; if you add 1–2 extras, name them clearly.
`;

  const prompt = `
You are an AI recipe generator for a household food-waste app.

User ingredients (as typed by the user):
${ingredientsDescription || "(not provided)"}

Household context and preferences:
${householdDescription || "(not provided)"}

Dietary / safety flags: ${flags.length ? flags.join(", ") : "none explicitly set"}

Your task:
- Propose 4 specific meal ideas that use mostly what the user already has.
- Focus on reducing food waste: prioritize ingredients that are perishable or likely to go bad first.
- Respect dietary flags as much as possible (e.g. halal, vegetarian, allergy-safe).
- For each recipe, include a title, 2–3 "why" bullets, a short ingredients list, and 3–6 steps.

${schemaHint}
`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
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
      console.error('Gemini API error:', errorText);
      return res.status(500).json({
        error: "Gemini API request failed",
        details: errorText,
      });
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";

    if (!text) {
      console.error('No text in response:', data);
      return res.status(500).json({
        error: "No recipe content generated",
        details: "API response was empty"
      });
    }

    // Try to parse the model's JSON response; fallback to raw text if parsing fails.
    const cleaned = String(text)
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();

    const normalizeRecipes = (value) => {
      if (!Array.isArray(value)) return [];
      return value
        .filter((r) => r?.title)
        .map((r) => ({
          title: r?.title || "Untitled Recipe",
          why: Array.isArray(r?.why) ? r.why : ["Uses available ingredients"],
          ingredients: Array.isArray(r?.ingredients) ? r.ingredients : [],
          steps: Array.isArray(r?.steps) ? r.steps : [],
        }))
        .filter((r) => r.title && (r.ingredients.length > 0 || r.steps.length > 0));
    };

    const repairJson = (raw) => {
      let jsonStr = String(raw ?? "").trim();

      const firstBrace = jsonStr.indexOf("{");
      const lastBrace = jsonStr.lastIndexOf("}");
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
      }

      jsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1");

      const openBraces = (jsonStr.match(/{/g) || []).length;
      const closeBraces = (jsonStr.match(/}/g) || []).length;
      const openBrackets = (jsonStr.match(/\[/g) || []).length;
      const closeBrackets = (jsonStr.match(/\]/g) || []).length;

      for (let i = 0; i < openBrackets - closeBrackets; i++) jsonStr += "]";
      for (let i = 0; i < openBraces - closeBraces; i++) jsonStr += "}";

      return jsonStr;
    };

    const parseRecipesFromText = (raw) => {
      const attempts = [String(raw ?? ""), repairJson(raw)];
      for (const candidate of attempts) {
        try {
          const parsed = JSON.parse(candidate);
          const recipes = normalizeRecipes(parsed?.recipes);
          if (recipes.length) return recipes;
        } catch {
          // Continue to next strategy.
        }
      }
      return [];
    };

    const parsedRecipes = parseRecipesFromText(cleaned);
    if (parsedRecipes.length) {
      return res.status(200).json({ recipes: parsedRecipes, text: "" });
    }

    return res.status(200).json({ recipes: [], text: cleaned });
  } catch (error) {
    console.error('Recipe API error:', error);
    return res.status(500).json({
      error: "Failed to call Gemini API",
      details: error?.message ?? String(error),
    });
  }
}


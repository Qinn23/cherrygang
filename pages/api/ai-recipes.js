// Free-form AI recipe generator using Gemini.
// Expects POST { ingredientsDescription: string, householdDescription?: string, filters?: { halal?: boolean, vegetarian?: boolean, allergySafe?: boolean } }
// Returns { text }
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

  const prompt = `
You are an AI recipe generator for a household food-waste app.

User ingredients (as typed by the user):
${ingredientsDescription || "(not provided)"}

Household context and preferences:
${householdDescription || "(not provided)"}

Dietary / safety flags: ${flags.length ? flags.join(", ") : "none explicitly set"}

Your task:
- Propose 3–4 specific meal ideas that use mostly what the user already has.
- Focus on reducing food waste: prioritize ingredients that are perishable or likely to go bad first.
- Respect dietary flags as much as possible (e.g. halal, vegetarian, allergy-safe).
- For each recipe, include:
  - A clear title
  - 2–3 bullet points of why it's a good idea for this household
  - A very short method (3–5 concise steps)

Format:
- Use plain text or simple markdown with headings and bullet lists.
- Do NOT add disclaimers; keep the answer focused and practical.
`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.75,
      maxOutputTokens: 896,
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
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to call Gemini API",
      details: error?.message ?? String(error),
    });
  }
}


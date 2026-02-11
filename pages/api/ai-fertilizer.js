// AI-powered fertilizer & compost planning using Gemini.
// Expects POST {
//   wasteDescription: string,
//   householdDescription?: string,
//   gardenDescription?: string
// }
// Returns { ideas?: Array<{ title: string, summary?: string, steps?: string[], bestFor?: string[], safetyNotes?: string[] }>, text?: string }
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

  const {
    wasteDescription = "",
    householdDescription = "",
    gardenDescription = "",
  } = req.body ?? {};

  const schemaHint = `Return ONLY valid JSON (no markdown, no code fences) with this exact shape:
{
  "ideas": [
    {
      "title": "string",
      "summary": "string",
      "steps": ["string", "string"],
      "bestFor": ["string", "string"],
      "safetyNotes": ["string", "string"]
    }
  ]
}
Rules:
- Always return exactly 4 ideas.
- Keep titles short (max 8 words).
- "summary" should be one short sentence (max 12 words).
- "steps" must be 3–4 concise steps.
- "bestFor" should list 1–3 plant settings.
- "safetyNotes" should list 1–3 cautions when needed; use an empty array if none.
`;

  const prompt = `
You are an expert in household composting and DIY fertilizer for a family food-waste app.

Food waste and materials the user wants to repurpose:
${wasteDescription || "(not provided)"}

Household context (kids, pets, sensitivities, smell tolerance, etc.):
${householdDescription || "(not provided)"}

Outdoor / plant situation (balcony pots, garden size, indoor plants, etc.):
${gardenDescription || "(not provided)"}

Your task:
- Propose 4 practical ways to use this waste.
- Focus on low-odor, low-mess, household-safe methods.
- Include any important safety notes (e.g. meat/dairy, pests, bad smells).

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
      temperature: 0.6,
      maxOutputTokens: 2048,
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
      return res.status(500).json({
        error: "Gemini API request failed",
        details: errorText,
      });
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";

    const cleaned = String(text)
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();

    const tryRepairJson = (raw) => {
      let jsonStr = raw.trim();
      if (!jsonStr.endsWith("}")) {
        const lastBrace = jsonStr.lastIndexOf("}");
        if (lastBrace > -1) {
          jsonStr = jsonStr.slice(0, lastBrace + 1);
        }
      }

      const openBraces = (jsonStr.match(/{/g) || []).length;
      const closeBraces = (jsonStr.match(/}/g) || []).length;
      const openBrackets = (jsonStr.match(/\[/g) || []).length;
      const closeBrackets = (jsonStr.match(/\]/g) || []).length;

      for (let i = 0; i < openBrackets - closeBrackets; i++) jsonStr += "]";
      for (let i = 0; i < openBraces - closeBraces; i++) jsonStr += "}";

      return jsonStr;
    };

    try {
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (firstErr) {
        parsed = JSON.parse(tryRepairJson(cleaned));
      }
      const ideas = Array.isArray(parsed?.ideas) ? parsed.ideas : null;
      if (ideas && ideas.length) {
        const normalized = ideas
          .filter((i) => i?.title)
          .map((i) => ({
            title: i.title,
            summary: i?.summary || "",
            steps: Array.isArray(i?.steps) ? i.steps : [],
            bestFor: Array.isArray(i?.bestFor) ? i.bestFor : [],
            safetyNotes: Array.isArray(i?.safetyNotes) ? i.safetyNotes : [],
          }))
          .filter((i) => i.title && i.steps.length);

        if (normalized.length) {
          return res.status(200).json({ ideas: normalized, text: "" });
        }
      }
    } catch (parseErr) {
      // Fall through to return text
    }

    return res.status(200).json({ text: cleaned });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to call Gemini API",
      details: error?.message ?? String(error),
    });
  }
}


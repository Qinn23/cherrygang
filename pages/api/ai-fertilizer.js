// AI-powered fertilizer & compost planning using Gemini.
// Expects POST {
//   wasteDescription: string,
//   householdDescription?: string,
//   gardenDescription?: string
// }
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

  const {
    wasteDescription = "",
    householdDescription = "",
    gardenDescription = "",
  } = req.body ?? {};

  const prompt = `
You are an expert in household composting and DIY fertilizer for a family food-waste app.

Food waste and materials the user wants to repurpose:
${wasteDescription || "(not provided)"}

Household context (kids, pets, sensitivities, smell tolerance, etc.):
${householdDescription || "(not provided)"}

Outdoor / plant situation (balcony pots, garden size, indoor plants, etc.):
${gardenDescription || "(not provided)"}

Your task:
- First, decide whether each major item is best for:
  - "compost only"
  - "liquid fertilizer / tea"
  - "avoid / trash" (if unsafe at home scale)
- Then propose 2–3 practical ways to use this waste:
  - For each idea, include:
    - A short title
    - A bullet list of steps (3–6 steps max)
    - Best for: e.g. "balcony pots", "indoor plants", "vegetable garden"
- Include any important safety notes (e.g. meat/dairy, rats, bad smells, pests, raw manure).

Format:
- Use clear headings for each idea.
- Use short bullet lists for steps.
- Keep the answer under about 500 words and very practical.
`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 768,
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


// Simple Gemini-backed chat endpoint.
// Expects POST { messages: [{ role: "user" | "assistant", content: string }] }
// Returns { reply }
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

  const { messages = [] } = req.body ?? {};

  const systemPreamble = `
You are an AI kitchen and food-waste assistant for a household app called Smart Pantry.
Help families:
- Reduce food waste
- Plan meals with what they already have
- Respect allergies, halal/vegetarian preferences and other constraints
- Turn leftovers or expired food into safe compost or fertilizer when appropriate

Keep answers short, practical and friendly.
If a user asks something unrelated to food, cooking or sustainability, gently steer them back to those topics.
`;

  const parts = [
    {
      role: "user",
      parts: [{ text: systemPreamble }],
    },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content ?? "" }],
    })),
  ];

  const body = {
    contents: parts,
    generationConfig: {
      temperature: 0.7,
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
    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to call Gemini API",
      details: error?.message ?? String(error),
    });
  }
}


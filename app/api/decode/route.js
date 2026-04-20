// Gemini API route - uses Google's free tier
// Get your free API key at: https://aistudio.google.com/app/apikey

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a careful medical assistant helping a patient in India understand a prescription.

Given a photo of a prescription, extract every medicine you can identify. For each medicine, provide:
- name: Medicine name (corrected spelling if handwritten). If unsure, include your best reading + "(?)".
- dosage: Strength per unit, e.g., "500 mg", "5 ml". Use "—" if not visible.
- frequency: How often per day, e.g., "twice daily", "once at night". Use "—" if not specified.
- duration: How many days, e.g., "5 days". Use "—" if not specified.
- timing: When relative to meals, e.g., "after food", "empty stomach". Use "—" if not specified.
- purpose_en: ONE simple sentence in plain English on what the medicine treats. Write for a non-medical reader.
- purpose_hi: The SAME sentence in Hindi, in Devanagari script.
- side_effects_en: 2-3 common side effects, comma-separated, plain English.
- side_effects_hi: Same in Hindi, Devanagari.
- confidence: "high" if handwriting is clear, "medium" if somewhat clear, "low" if guessing.

Rules:
- Never invent medicines you can't see. If something is too illegible to guess, skip it and mention it in "notes".
- If you are unsure about dosage or frequency, leave it as "—" rather than guessing. Safety > completeness.
- Do NOT give dosing recommendations of your own. Only report what is on the prescription.
- Hindi should be natural and simple — like explaining to a family member, not clinical language.

Output STRICT JSON matching this schema, no markdown, no preamble:
{
  "is_prescription": true | false,
  "reason": "only if is_prescription is false, brief explanation",
  "medicines": [
    {
      "name": "...",
      "dosage": "...",
      "frequency": "...",
      "duration": "...",
      "timing": "...",
      "purpose_en": "...",
      "purpose_hi": "...",
      "side_effects_en": "...",
      "side_effects_hi": "...",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "overall_confidence": "high" | "medium" | "low",
  "notes": "Anything unclear, illegible portions, or warnings the patient should know"
}`;

export async function POST(req) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Server is missing GEMINI_API_KEY. Set it in Vercel env variables." },
        { status: 500 }
      );
    }

    const { base64, mediaType } = await req.json();
    if (!base64 || !mediaType) {
      return Response.json({ error: "Missing image data." }, { status: 400 });
    }

    // Gemini 2.0 Flash - free tier, fast, supports vision
    const model = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mediaType,
                data: base64,
              },
            },
            {
              text: "Decode this prescription. Return ONLY the JSON object described in the system prompt.",
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API error:", errText);
      return Response.json(
        { error: `Gemini API error (${res.status}). Check your API key and quota.` },
        { status: 502 }
      );
    }

    const data = await res.json();

    // Extract text from Gemini response
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!text) {
      return Response.json(
        { error: "Gemini returned an empty response. Try again with a clearer image." },
        { status: 502 }
      );
    }

    // Strip markdown fences if any
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return Response.json(
        {
          error: "Could not parse the AI response. The model returned text that wasn't valid JSON.",
          raw: cleaned.slice(0, 500),
        },
        { status: 502 }
      );
    }

    return Response.json(parsed);
  } catch (err) {
    console.error("Decode error:", err);
    return Response.json(
      { error: err?.message || "Unknown server error." },
      { status: 500 }
    );
  }
}

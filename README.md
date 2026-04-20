# Prescription Decoder

A simple web app that reads a photo of a prescription and explains each medicine to the patient in plain English and Hindi. Built to explore whether a vision LLM can close the information gap patients face after a rushed consultation.

**Live demo:** [your-vercel-url]
**60-second walkthrough:** [your-loom-url]

---

## Why I built this

In India, most patients leave a clinic with a handwritten prescription they can't read and instructions they've already forgotten. Pharmacists hurry. Doctors have six minutes per patient. The medicine gets taken wrong — or not at all.

I wanted to see how close an off-the-shelf vision LLM could get to solving this end-to-end: upload a photo → get a clear, bilingual breakdown of every medicine, what it's for, and common side effects. No rules engine, no OCR pipeline. Just the model, a careful prompt, and a thin UI.

## How it works

1. User uploads a prescription photo (drag-drop or click).
2. Browser converts it to base64 and posts it to `/api/decode`.
3. The server route sends the image to Gemini 2.0 Flash along with a system prompt that asks for strict JSON with medicine name, dosage, frequency, duration, timing, a plain-language purpose, and common side effects — in both English and Hindi.
4. The UI renders each medicine as a card, with a language toggle and a per-medicine confidence badge.

A few design choices worth calling out:

- **Confidence flags over false certainty.** Each medicine gets a `high / medium / low` confidence label based on how legible it was. The model is instructed to return `"—"` rather than guess at dosage.
- **No self-generated dosing advice.** The model only reports what's on the prescription — it never adds a dose the doctor didn't prescribe.
- **Bilingual output.** Hindi is written in Devanagari, not transliterated. This matters for the actual target user.

## Limitations (what I'd change)

- **Handwriting is still hard.** On very messy prescriptions the model skips items instead of inventing them — safe but incomplete. A next version would re-prompt on unclear regions with a crop.
- **No drug-interaction check.** If a patient uploads two prescriptions, the app doesn't flag contraindications. That's where this would actually save lives.
- **No voice output.** Many patients can't read in any language. Text-to-speech in Hindi/regional languages should be the next feature.

## Tech

- Next.js 14 (App Router)
- Tailwind CSS
- Google Gemini 2.0 Flash (vision)
- Deployed on Vercel

## Run it yourself

You need a free Gemini API key from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey). The free tier covers thousands of decodes per day.

```bash
git clone <this-repo>
cd prescription-decoder
npm install
cp .env.local.example .env.local
# Edit .env.local and paste your GEMINI_API_KEY
npm run dev
```

Then open http://localhost:3000.

## Disclaimer

This is a demo. Vision models make mistakes — especially on handwriting. Never use this as a substitute for a doctor or pharmacist.

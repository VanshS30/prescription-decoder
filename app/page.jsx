"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [image, setImage] = useState(null); // { base64, mediaType, previewUrl }
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState("en"); // "en" or "hi"
  const fileRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image is too large. Please upload something under 10 MB.");
      return;
    }
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(",")[1];
      setImage({
        base64,
        mediaType: file.type,
        previewUrl: dataUrl,
      });
    };
    reader.readAsDataURL(file);
  }

  async function decode() {
    if (!image) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64: image.base64,
          mediaType: image.mediaType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setImage(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const confidenceColor = {
    high: "bg-emerald-100 text-emerald-800",
    medium: "bg-amber-100 text-amber-800",
    low: "bg-rose-100 text-rose-800",
  };

  return (
    <main className="min-h-screen">
      {/* Disclaimer banner */}
      <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm px-4 py-2 text-center">
        ⚠️ Demo tool. Not medical advice. Always verify with your doctor or
        pharmacist before taking any medicine.
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Prescription Decoder
          </h1>
          <p className="mt-2 text-slate-600">
            Upload a photo of your prescription. Understand each medicine in
            plain English and Hindi.
          </p>
        </header>

        {/* Upload area */}
        {!image && (
          <label
            htmlFor="file-input"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className="block border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:bg-white hover:border-slate-400 transition"
          >
            <div className="text-5xl mb-3">📄</div>
            <div className="font-medium text-slate-700">
              Drop a prescription photo here, or click to upload
            </div>
            <div className="text-sm text-slate-500 mt-1">
              JPG, PNG, or WEBP — up to 10 MB
            </div>
            <input
              id="file-input"
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
        )}

        {/* Preview + action */}
        {image && !result && (
          <div className="space-y-4">
            <img
              src={image.previewUrl}
              alt="Prescription preview"
              className="w-full rounded-xl border border-slate-200 shadow-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={decode}
                disabled={loading}
                className="flex-1 bg-slate-900 text-white font-medium py-3 rounded-xl hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? "Decoding…" : "Decode prescription"}
              </button>
              <button
                onClick={reset}
                disabled={loading}
                className="px-4 py-3 rounded-xl border border-slate-300 hover:bg-white transition disabled:opacity-60"
              >
                Change
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-2 space-y-4">
            {!result.is_prescription ? (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl">
                This doesn't look like a prescription.{" "}
                {result.reason ? `(${result.reason})` : ""} Try another image.
              </div>
            ) : (
              <>
                {/* Language toggle + overall confidence */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLang("en")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        lang === "en"
                          ? "bg-slate-900 text-white"
                          : "bg-white border border-slate-300 text-slate-700"
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setLang("hi")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        lang === "hi"
                          ? "bg-slate-900 text-white"
                          : "bg-white border border-slate-300 text-slate-700"
                      }`}
                    >
                      हिन्दी
                    </button>
                  </div>
                  {result.overall_confidence && (
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        confidenceColor[result.overall_confidence] ||
                        confidenceColor.medium
                      }`}
                    >
                      Overall confidence: {result.overall_confidence}
                    </span>
                  )}
                </div>

                {/* Notes */}
                {result.notes && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-sm">
                    <strong>Note:</strong> {result.notes}
                  </div>
                )}

                {/* Medicines */}
                {(result.medicines || []).map((m, i) => (
                  <div
                    key={i}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h2 className="text-xl font-semibold text-slate-900">
                        {i + 1}. {m.name || "Unknown medicine"}
                      </h2>
                      {m.confidence && (
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            confidenceColor[m.confidence] ||
                            confidenceColor.medium
                          }`}
                        >
                          {m.confidence}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                      <Field label="Dosage" value={m.dosage} />
                      <Field label="Frequency" value={m.frequency} />
                      <Field label="Duration" value={m.duration} />
                      <Field label="When" value={m.timing} />
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                          What it's for
                        </div>
                        <div className="text-slate-800">
                          {lang === "en" ? m.purpose_en : m.purpose_hi}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                          Common side effects
                        </div>
                        <div className="text-slate-800">
                          {lang === "en"
                            ? m.side_effects_en
                            : m.side_effects_hi}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={reset}
                  className="w-full bg-white border border-slate-300 font-medium py-3 rounded-xl hover:bg-slate-50 transition"
                >
                  Decode another prescription
                </button>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-200 text-xs text-slate-500 text-center">
          <p>
            This tool uses an AI vision model to read prescriptions. It can make
            mistakes — especially with messy handwriting. Never use it as a
            substitute for professional medical guidance.
          </p>
          <p className="mt-2">
            Built with Google Gemini · Next.js · Tailwind
          </p>
        </footer>
      </div>
    </main>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="text-slate-800 font-medium">{value || "—"}</div>
    </div>
  );
}

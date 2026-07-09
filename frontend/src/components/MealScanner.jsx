import { useRef, useState } from "react";
import { Camera, Loader2, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { scanMeal } from "../lib/coachApi";

const CONFIDENCE_LABEL = { high: "High confidence", medium: "Moderate estimate", low: "Rough estimate" };
const CONFIDENCE_COLOR = { high: "text-emerald-500", medium: "text-amber-500", low: "text-rose-500" };

/**
 * MealScanner — lets the user photo or upload a meal image and get a
 * Gemini Vision calorie/macro estimate. Calls onAdd(calories) when accepted.
 */
export default function MealScanner({ onAdd }) {
  const fileRef = useRef(null);
  const [preview, setPreview]   = useState(null); // object URL
  const [base64, setBase64]     = useState(null);
  const [mime, setMime]         = useState("image/jpeg");
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [open, setOpen]         = useState(false);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null); setBase64(null); setResult(null); setError(null); setLoading(false);
  };

  const close = () => { reset(); setOpen(false); };

  const handleFile = (file) => {
    if (!file) return;
    const objUrl = URL.createObjectURL(file);
    setPreview(objUrl);
    setMime(file.type || "image/jpeg");
    setResult(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => setBase64(e.target.result); // full data-URL
    reader.readAsDataURL(file);
  };

  const analyse = async () => {
    if (!base64) return;
    setLoading(true);
    setError(null);
    const data = await scanMeal(base64, mime);
    setLoading(false);
    if (!data) {
      setError("Couldn't analyse this image. Try a clearer photo.");
    } else {
      setResult(data);
    }
  };

  const accept = () => {
    if (result?.calories) onAdd(result.calories);
    close();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
        data-testid="meal-scanner-open"
      >
        <Camera className="h-3.5 w-3.5" />
        Scan meal
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
            onClick={(e) => e.target === e.currentTarget && close()}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm rounded-[var(--radius)] border bg-card p-6 shadow-xl"
            >
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  <h2 className="font-heading text-lg font-bold">Scan a meal</h2>
                </div>
                <button onClick={close} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Image preview / drop zone */}
              {!preview ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-3 rounded-[var(--radius)] border-2 border-dashed border-border py-10 transition-colors hover:border-primary hover:bg-muted/30"
                  data-testid="meal-scanner-dropzone"
                >
                  <Camera className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Tap to take a photo or upload</p>
                </button>
              ) : (
                <div className="relative overflow-hidden rounded-[var(--radius)]">
                  <img src={preview} alt="Meal preview" className="max-h-56 w-full object-cover" />
                  <button
                    onClick={reset}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
                data-testid="meal-scanner-input"
              />

              {/* Result */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-[var(--radius)] border bg-muted/30 p-4"
                  data-testid="meal-scan-result"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{result.description}</p>
                    <span className={`text-xs font-medium ${CONFIDENCE_COLOR[result.confidence] || "text-muted-foreground"}`}>
                      {CONFIDENCE_LABEL[result.confidence] || result.confidence}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-4 text-sm">
                    <span className="font-bold text-primary">{result.calories} kcal</span>
                    <span className="text-muted-foreground">P: {result.protein}g</span>
                    <span className="text-muted-foreground">C: {result.carbs}g</span>
                    <span className="text-muted-foreground">F: {result.fat}g</span>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">AI estimates — always verify for medical purposes.</p>
                </motion.div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-[var(--radius)] border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-500">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                {!result ? (
                  <button
                    type="button"
                    onClick={analyse}
                    disabled={!base64 || loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius)] bg-primary py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                    data-testid="meal-scanner-analyse"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    {loading ? "Analysing…" : "Analyse"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={accept}
                    className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius)] bg-primary py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    data-testid="meal-scanner-accept"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Add {result.calories} kcal
                  </button>
                )}
                <button
                  type="button"
                  onClick={close}
                  className="rounded-[var(--radius)] border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase";

// Calls the secure Cloud Function — the Gemini key never touches the browser.
const functions = getFunctions(app, "europe-west1");
const coachTipFn = httpsCallable(functions, "coachTip", { timeout: 15000 });
const mealScanFn = httpsCallable(functions, "mealScan", { timeout: 30000 });

/**
 * Fetch a structured coach tip.
 * Returns { message, mood, emoji, category } or null on failure.
 * category: "warning" | "celebration" | "encouragement" | "neutral"
 */
export async function fetchCoachTip(payload) {
  try {
    const result = await coachTipFn(payload);
    const d = result.data;
    if (!d?.message) return null;
    return {
      message:  d.message.trim(),
      mood:     d.mood     || null,
      emoji:    d.emoji    || null,
      category: d.category || "neutral",
    };
  } catch (err) {
    // Log the full error so it is visible in DevTools console
    console.error(
      "[WLPro] coachTip Cloud Function error:",
      err?.code,           // e.g. "functions/internal"
      err?.message,        // human-readable
      err?.details ?? "",  // extra detail if present
    );
    return null;
  }
}

/**
 * Scan a meal photo via Gemini Vision.
 * @param {string} imageBase64 - data-URL or raw base64 string
 * @param {string} [mimeType]  - defaults to "image/jpeg"
 * @returns {{ description, calories, protein, carbs, fat, confidence } | null}
 */
export async function scanMeal(imageBase64, mimeType = "image/jpeg") {
  try {
    const result = await mealScanFn({ imageBase64, mimeType });
    return result.data || null;
  } catch (err) {
    console.error(
      "[WLPro] mealScan Cloud Function error:",
      err?.code,
      err?.message,
      err?.details ?? "",
    );
    return null;
  }
}

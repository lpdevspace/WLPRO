import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase";

// Calls the secure Cloud Function — the OpenAI key never touches the browser.
const functions = getFunctions(app, "europe-west1");
const coachTipFn = httpsCallable(functions, "coachTip", { timeout: 15000 });

export async function fetchCoachTip(payload) {
  try {
    const result = await coachTipFn(payload);
    return result.data?.message?.trim() || null;
  } catch (err) {
    // Gracefully return null so CoachCard falls back to rule-based message
    console.warn("coachTip function error:", err.message);
    return null;
  }
}

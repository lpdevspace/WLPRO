const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Store your Gemini key in Firebase Secret Manager:
// firebase functions:secrets:set GEMINI_API_KEY
const geminiKey = defineSecret("GEMINI_API_KEY");

// ---------------------------------------------------------------------------
// Shared Gemini helper
// ---------------------------------------------------------------------------
async function callGemini(key, body) {
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    logger.error("Gemini error", err);
    throw new HttpsError("internal", "AI service unavailable.");
  }
  return res.json();
}

function rawText(data) {
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

/**
 * Strip optional ```json ... ``` or ``` ... ``` fences that some Gemini
 * versions add even when responseMimeType is set to application/json.
 */
function stripJsonFence(text) {
  if (!text) return text;
  // Remove ```json\n...\n``` or ```\n...\n```
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) return fenced[1].trim();
  return text;
}

// ---------------------------------------------------------------------------
// coachTip — structured output: { message, mood, emoji, category }
// category: "warning" | "celebration" | "encouragement" | "neutral"
// ---------------------------------------------------------------------------
const COACH_SYSTEM =
  "You are an upbeat, emotionally intelligent weight-loss and wellness coach inside an " +
  "app called WL Pro. Write SHORT, punchy, genuinely encouraging messages (max 2 sentences, " +
  "under 45 words). Be warm and human, never preachy, never give medical advice, never shame " +
  "the user about weight gain. Celebrate consistency and effort over outcomes.\n\n" +
  "You MUST respond with valid JSON only — no markdown, no prose outside the JSON object.\n" +
  "Schema: { \"message\": string, \"mood\": string (1-3 word mood label), \"emoji\": string (single emoji), \"category\": \"warning\" | \"celebration\" | \"encouragement\" | \"neutral\" }";

function buildCoachPrompt(p) {
  const parts = [];
  if (p.name) parts.push(`User's name: ${p.name}.`);
  if (p.current != null) parts.push(`Current weight: ${p.current} ${p.unit}.`);
  if (p.total_change != null) parts.push(`Total change from start: ${p.total_change > 0 ? "+" : ""}${p.total_change} ${p.unit}.`);
  if (p.last_change != null) parts.push(`Change since last entry: ${p.last_change > 0 ? "+" : ""}${p.last_change} ${p.unit}.`);
  if (p.streak) parts.push(`Current logging streak: ${p.streak} days.`);
  if (p.total_entries) parts.push(`Total weigh-ins logged: ${p.total_entries}.`);
  if (p.goal_progress != null) parts.push(`Goal progress: ${Math.round(p.goal_progress * 100)}%.`);
  if (p.to_goal != null) parts.push(`Remaining to goal: ${p.to_goal} ${p.unit}.`);
  if (p.eta_weeks != null) parts.push(`Estimated weeks to goal at current rate: ${p.eta_weeks}.`);
  if (p.plateau) parts.push("The user appears to be in a weight plateau.");
  if (p.calories) parts.push(`Today's calories logged: ${p.calories} kcal.`);
  if (p.water) parts.push(`Water today: ${p.water} glasses.`);
  if (p.steps) parts.push(`Steps today: ${p.steps}.`);
  if (!p.logged_today) parts.push("The user has NOT logged their weight today.");
  return parts.join(" ");
}

exports.coachTip = onCall(
  { secrets: [geminiKey], region: "europe-west1" },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Login required.");
    const payload = request.data || {};
    if (JSON.stringify(payload).length > 2000) throw new HttpsError("invalid-argument", "Payload too large.");

    try {
      const data = await callGemini(geminiKey.value(), {
        systemInstruction: { parts: [{ text: COACH_SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: buildCoachPrompt(payload) }] }],
        generationConfig: { maxOutputTokens: 150, temperature: 0.8, responseMimeType: "application/json" },
      });

      const text = rawText(data);
      if (!text) return { message: null };

      // Strip any code-fence wrapper Gemini occasionally adds
      const clean = stripJsonFence(text);

      // Parse structured JSON; fall back gracefully to plain text
      try {
        const parsed = JSON.parse(clean);
        return {
          message:  parsed.message  || null,
          mood:     parsed.mood     || null,
          emoji:    parsed.emoji    || null,
          category: parsed.category || "neutral",
        };
      } catch {
        // Gemini returned plain text despite instruction — still usable
        return { message: clean, mood: null, emoji: null, category: "neutral" };
      }
    } catch (e) {
      logger.error("coachTip error", e);
      throw new HttpsError("internal", "Could not fetch tip.");
    }
  }
);

// ---------------------------------------------------------------------------
// mealScan — Gemini Vision: photo → { calories, protein, carbs, fat, description }
// Expects request.data.imageBase64 (data-URL or raw base64) + optional mimeType
// ---------------------------------------------------------------------------
const MEAL_SYSTEM =
  "You are a professional nutritionist with expertise in estimating meal nutrition from photos. " +
  "Analyse the food in the image and return a JSON object only — no prose, no markdown.\n" +
  "Schema: { \"description\": string (brief meal description, max 12 words), \"calories\": number (kcal, integer), " +
  "\"protein\": number (grams, 1dp), \"carbs\": number (grams, 1dp), \"fat\": number (grams, 1dp), " +
  "\"confidence\": \"high\" | \"medium\" | \"low\" }. " +
  "If you cannot identify food in the image, set calories to 0 and confidence to \"low\".";

exports.mealScan = onCall(
  { secrets: [geminiKey], region: "europe-west1" },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Login required.");

    const { imageBase64, mimeType = "image/jpeg" } = request.data || {};
    if (!imageBase64 || typeof imageBase64 !== "string") {
      throw new HttpsError("invalid-argument", "imageBase64 is required.");
    }
    // Strip data-URL prefix if present
    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    if (base64Data.length > 1_500_000) {
      throw new HttpsError("invalid-argument", "Image too large. Max ~1 MB base64.");
    }

    try {
      const data = await callGemini(geminiKey.value(), {
        systemInstruction: { parts: [{ text: MEAL_SYSTEM }] },
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: "Estimate the nutrition for this meal." },
          ],
        }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.3, responseMimeType: "application/json" },
      });

      const text = rawText(data);
      if (!text) throw new HttpsError("internal", "Empty response from AI.");

      const result = JSON.parse(stripJsonFence(text));
      return {
        description: result.description || "Unknown meal",
        calories:    Math.round(result.calories || 0),
        protein:     result.protein || 0,
        carbs:       result.carbs   || 0,
        fat:         result.fat     || 0,
        confidence:  result.confidence || "low",
      };
    } catch (e) {
      if (e instanceof HttpsError) throw e;
      logger.error("mealScan error", e);
      throw new HttpsError("internal", "Could not scan meal.");
    }
  }
);

// ---------------------------------------------------------------------------
// weeklySummary — scheduled every Monday 08:00 UTC
// Reads each user's last 7 days of weight entries and writes a Gemini recap
// to: users/{uid}/weeklySummaries/{YYYY-MM-DD}
// ---------------------------------------------------------------------------
const WEEKLY_SYSTEM =
  "You are a warm, encouraging wellness coach writing a personalised weekly recap for a " +
  "weight-tracking app called WL Pro. Write 3-4 conversational sentences. Highlight the " +
  "week's trend, celebrate any wins (logging consistency, downward trend, goal proximity), " +
  "and offer one practical focus for the coming week. Keep it under 80 words. " +
  "Never shame or be negative about weight gain. Use the user's first name.";

exports.weeklySummary = onSchedule(
  { schedule: "every monday 08:00", timeZone: "UTC", secrets: [geminiKey], region: "europe-west1" },
  async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().slice(0, 10);
    const today  = new Date().toISOString().slice(0, 10);

    const usersSnap = await db.collection("users").get();
    const promises = usersSnap.docs.map(async (userDoc) => {
      try {
        const uid       = userDoc.id;
        const profile   = userDoc.data();
        const firstName = (profile?.displayName || "there").split(" ")[0];
        const unit      = profile?.unit || "kg";

        // Fetch last 7 days of weight entries
        const weightsSnap = await db
          .collection("users").doc(uid).collection("weights")
          .where("date", ">=", cutoff)
          .orderBy("date", "asc")
          .get();

        if (weightsSnap.empty) return; // No data this week — skip

        const entries = weightsSnap.docs.map((d) => d.data());
        const weights = entries.map((e) => e.weight).filter(Boolean);
        const startW  = weights[0];
        const endW    = weights[weights.length - 1];
        const change  = endW != null && startW != null ? +(endW - startW).toFixed(2) : null;
        const avgW    = weights.length
          ? +(weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(2)
          : null;

        const prompt =
          `User's first name: ${firstName}. ` +
          `Unit: ${unit}. ` +
          `Entries this week: ${weights.length} out of 7 days. ` +
          (startW != null ? `Starting weight: ${startW} ${unit}. ` : "") +
          (endW   != null ? `Ending weight: ${endW} ${unit}. `     : "") +
          (change != null ? `Net change: ${change > 0 ? "+" : ""}${change} ${unit}. ` : "") +
          (avgW   != null ? `Weekly average: ${avgW} ${unit}. `    : "") +
          (profile?.goalWeight != null ? `Goal weight: ${profile.goalWeight} ${unit}. ` : "") +
          "Write the weekly recap now.";

        const data = await callGemini(geminiKey.value(), {
          systemInstruction: { parts: [{ text: WEEKLY_SYSTEM }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.75 },
        });

        const summary = rawText(data);
        if (!summary) return;

        await db
          .collection("users").doc(uid)
          .collection("weeklySummaries").doc(today)
          .set({
            summary,
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
            weekStart:   cutoff,
            weekEnd:     today,
            entriesCount: weights.length,
            netChange:   change,
          });

        logger.info(`Weekly summary written for uid=${uid}`);
      } catch (e) {
        logger.error(`Weekly summary failed for uid=${userDoc.id}`, e);
      }
    });

    await Promise.allSettled(promises);
    logger.info("weeklySummary run complete");
  }
);

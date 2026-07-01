const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { logger } = require("firebase-functions");

// Store your OpenAI key in Firebase Secret Manager:
// firebase functions:secrets:set OPENAI_API_KEY
const openAiKey = defineSecret("OPENAI_API_KEY");

const SYSTEM_PROMPT =
  "You are an upbeat, emotionally intelligent weight-loss and wellness coach inside an " +
  "app called WL Pro. You write SHORT, punchy, genuinely encouraging messages (max 2 " +
  "sentences, under 45 words). Be warm and human, never preachy, never give medical advice, " +
  "never shame the user about weight gain or fluctuations. Celebrate consistency and effort " +
  "over outcomes. Use at most one tasteful emoji. Output ONLY the message text — no quotes, " +
  "no preamble, no headline.";

function buildUserPrompt(p) {
  const parts = [];
  if (p.name) parts.push(`User's name: ${p.name}.`);
  if (p.current != null) parts.push(`Current weight: ${p.current} ${p.unit}.`);
  if (p.total_change != null)
    parts.push(`Total change from start: ${p.total_change > 0 ? "+" : ""}${p.total_change} ${p.unit}.`);
  if (p.last_change != null)
    parts.push(`Change since last entry: ${p.last_change > 0 ? "+" : ""}${p.last_change} ${p.unit}.`);
  if (p.streak) parts.push(`Current logging streak: ${p.streak} days.`);
  if (p.total_entries) parts.push(`Total weigh-ins logged: ${p.total_entries}.`);
  if (p.goal_progress != null)
    parts.push(`Goal progress: ${Math.round(p.goal_progress * 100)}%.`);
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
  // secrets array makes the key available inside the function
  { secrets: [openAiKey], region: "europe-west1" },
  async (request) => {
    // Must be authenticated
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Login required.");
    }

    const payload = request.data || {};

    // Basic rate-limit guard: max payload size check
    const str = JSON.stringify(payload);
    if (str.length > 2000) {
      throw new HttpsError("invalid-argument", "Payload too large.");
    }

    const userPrompt = buildUserPrompt(payload);

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey.value()}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 80,
          temperature: 0.8,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        logger.error("OpenAI error", err);
        throw new HttpsError("internal", "AI service unavailable.");
      }

      const data = await res.json();
      const message = data.choices?.[0]?.message?.content?.trim() || null;
      return { message };
    } catch (e) {
      logger.error("coachTip error", e);
      throw new HttpsError("internal", "Could not fetch tip.");
    }
  }
);

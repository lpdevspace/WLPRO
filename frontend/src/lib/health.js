// health.js — pure helpers for BMI, TDEE, healthy ranges, plateau detection

export function computeBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const hm = heightCm / 100;
  return weightKg / (hm * hm);
}

export function bmiCategory(bmi) {
  if (bmi == null) return null;
  if (bmi < 18.5) return { label: "Underweight", tone: "low" };
  if (bmi < 25)   return { label: "Healthy",     tone: "good" };
  if (bmi < 30)   return { label: "Overweight",  tone: "warn" };
  return             { label: "Obese",        tone: "high" };
}

export function healthyWeightRange(heightCm) {
  if (!heightCm) return null;
  const hm = heightCm / 100;
  return { minKg: 18.5 * hm * hm, maxKg: 24.9 * hm * hm };
}

/**
 * Mifflin-St Jeor TDEE estimate.
 * activityLevel: 1.2 | 1.375 | 1.55 | 1.725 | 1.9
 */
export function computeTDEE(weightKg, heightCm, ageYears, sex = "neutral", activityLevel = 1.375) {
  if (!weightKg || !heightCm || !ageYears) return null;
  let bmr;
  if (sex === "male")   bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
  else if (sex === "female") bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
  else bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 78; // neutral midpoint
  return Math.round(bmr * activityLevel);
}

// Plateau: weight change < 0.5 kg over the last 14 days of entries
export function detectPlateau(weights = [], goalProgress) {
  if (goalProgress != null && goalProgress >= 1) return { plateau: false };
  const sorted = [...weights].sort((a, b) => new Date(a.date) - new Date(b.date));
  const recent = sorted.slice(-14);
  if (recent.length < 7) return { plateau: false };
  const diff = Math.abs(recent[recent.length - 1].weightKg - recent[0].weightKg);
  return { plateau: diff < 0.5 };
}

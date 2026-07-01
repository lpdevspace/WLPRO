// Pure health/forecast helpers. Weights are in kg, ascending by date.

export function computeBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(bmi) {
  if (bmi == null) return null;
  if (bmi < 18.5) return { label: "Underweight", tone: "low" };
  if (bmi < 25) return { label: "Healthy", tone: "good" };
  if (bmi < 30) return { label: "Overweight", tone: "warn" };
  return { label: "Obese", tone: "high" };
}

// Healthy weight range (kg) for a height, using BMI 18.5–24.9.
export function healthyWeightRange(heightCm) {
  if (!heightCm) return null;
  const m = heightCm / 100;
  return { minKg: 18.5 * m * m, maxKg: 24.9 * m * m };
}

const DAY = 1000 * 60 * 60 * 24;
const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;

// Linear-regression slope of weight over time (kg/day and kg/week),
// using up to the last 56 days of data.
export function weightTrendRate(weights = []) {
  const pts = weights
    .map((w) => ({ t: new Date(w.date).getTime(), y: w.weightKg }))
    .sort((a, b) => a.t - b.t);
  if (pts.length < 2) return null;
  const cutoff = pts[pts.length - 1].t - 56 * DAY;
  const recent = pts.filter((p) => p.t >= cutoff);
  const data = recent.length >= 2 ? recent : pts;
  const t0 = data[0].t;
  const xs = data.map((p) => (p.t - t0) / DAY);
  const ys = data.map((p) => p.y);
  const mx = avg(xs);
  const my = avg(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < data.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  if (den === 0) return { perDay: 0, perWeek: 0 };
  const perDay = num / den;
  return { perDay, perWeek: perDay * 7 };
}

// Project when the goal weight will be reached.
// goal: { targetWeightKg }
export function forecastGoal(weights = [], goal) {
  if (!goal || goal.targetWeightKg == null || weights.length < 2) return null;
  const rate = weightTrendRate(weights);
  if (!rate) return null;
  const last = weights[weights.length - 1];
  const current = last.weightKg;
  const target = goal.targetWeightKg;
  const diff = target - current; // desired signed change

  if (Math.abs(diff) < 0.1) {
    return { status: "reached", ratePerWeek: rate.perWeek };
  }
  if (Math.abs(rate.perDay) < 0.0007) {
    return { status: "flat", ratePerWeek: rate.perWeek };
  }
  const days = diff / rate.perDay;
  if (days <= 0 || !isFinite(days)) {
    return { status: "away", ratePerWeek: rate.perWeek };
  }
  const etaDate = new Date(new Date(last.date).getTime() + days * DAY);
  return {
    status: "ontrack",
    etaDate,
    days,
    weeks: days / 7,
    ratePerWeek: rate.perWeek,
  };
}

// Detect a plateau: little movement over the last ~14 days while goal unmet.
export function detectPlateau(weights = [], goalProgress = null) {
  if (weights.length < 4) return { plateau: false };
  const last = weights[weights.length - 1];
  const cutoff = new Date(last.date).getTime() - 14 * DAY;
  const recent = weights.filter((w) => new Date(w.date).getTime() >= cutoff);
  if (recent.length < 3) return { plateau: false };
  const ys = recent.map((w) => w.weightKg);
  const range = Math.max(...ys) - Math.min(...ys);
  const goalReached = goalProgress != null && goalProgress >= 1;
  if (range <= 0.5 && !goalReached) {
    return { plateau: true, days: 14, rangeKg: range };
  }
  return { plateau: false };
}

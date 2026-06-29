// Pure helpers to derive insights from the user's data.

function dateKey(d) {
  const dt = new Date(d);
  return dt.toISOString().slice(0, 10);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// weights: [{ id, weightKg, date(ISO) }]  (any order)
// logs: [{ date('YYYY-MM-DD'), calories, water, steps }]
// goal: { targetWeightKg, targetDate, startWeightKg } | null
// photos: [...]
export function computeStats(weights = [], logs = [], goal = null, photos = []) {
  const sorted = [...weights].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );
  const current = sorted.length ? sorted[sorted.length - 1].weightKg : null;
  const previous =
    sorted.length > 1 ? sorted[sorted.length - 2].weightKg : null;
  const earliest = sorted.length ? sorted[0].weightKg : null;
  const start = goal?.startWeightKg ?? earliest;

  const lastChange = current != null && previous != null ? current - previous : null;
  const totalChange = current != null && start != null ? current - start : null;

  // Logging streak: consecutive days (ending today or yesterday) with a weigh-in.
  const days = new Set(sorted.map((w) => dateKey(w.date)));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  const loggedToday = days.has(dateKey(new Date()));

  // Goal progress (works for both loss and gain goals).
  let goalProgress = null;
  let toGoalKg = null;
  if (goal && current != null && start != null) {
    const denom = start - goal.targetWeightKg;
    goalProgress = denom !== 0 ? clamp((start - current) / denom, 0, 1) : 1;
    toGoalKg = current - goal.targetWeightKg;
  }

  const todayKey = dateKey(new Date());
  const today = logs.find((l) => l.date === todayKey) || {
    calories: 0,
    water: 0,
    steps: 0,
  };

  return {
    current,
    previous,
    start,
    earliest,
    lastChange,
    totalChange,
    streak,
    loggedToday,
    goalProgress,
    toGoalKg,
    today,
    totalEntries: sorted.length,
    totalPhotos: photos.length,
    sorted,
    bestStreak: streak, // simple; live streak doubles as best for now
  };
}

// Group weigh-ins into ISO weeks (Mon-start) and average them.
export function weeklyAverages(weights = []) {
  const map = new Map();
  for (const w of weights) {
    const d = new Date(w.date);
    const dayIdx = (d.getDay() + 6) % 7; // 0 = Monday
    const monday = new Date(d);
    monday.setDate(d.getDate() - dayIdx);
    const key = monday.toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(w.weightKg);
  }
  return [...map.entries()]
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([weekStart, vals]) => ({
      weekStart,
      avgKg: vals.reduce((s, v) => s + v, 0) / vals.length,
      count: vals.length,
    }));
}

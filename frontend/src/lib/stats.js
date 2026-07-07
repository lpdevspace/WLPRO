// Pure helpers to derive insights from the user's data.

function dateKey(d) {
  const dt = new Date(d);
  return dt.toISOString().slice(0, 10);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function addDays(dateStr, days) {
  const dt = new Date(dateStr);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function longestConsecutiveStreak(dateKeys) {
  if (!dateKeys.length) return 0;
  const sorted = [...new Set(dateKeys)].sort();
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === addDays(sorted[i - 1], 1)) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}

// weights: [{ id, weightKg, date(ISO) }]  (any order)
// logs:    [{ date('YYYY-MM-DD'), calories, water, steps, restDay? }]
// goal:    { targetWeightKg, targetDate, startWeightKg } | null
// photos:  [...]
export function computeStats(weights = [], logs = [], goal = null, photos = []) {
  const sorted = [...weights].sort((a, b) => new Date(a.date) - new Date(b.date));
  const current  = sorted.length ? sorted[sorted.length - 1].weightKg : null;
  const previous = sorted.length > 1 ? sorted[sorted.length - 2].weightKg : null;
  const earliest = sorted.length ? sorted[0].weightKg : null;
  const start    = goal?.startWeightKg ?? earliest;

  const lastChange  = current != null && previous != null ? current - previous : null;
  const totalChange = current != null && start    != null ? current - start    : null;

  // Logging streak — rest days count as logged (streak freeze)
  const dayKeys = sorted.map((w) => dateKey(w.date));
  const days = new Set(dayKeys);

  // Merge rest days into the streak-eligible set
  const restDaySet = new Set(
    logs.filter((l) => l.restDay).map((l) => l.id || l.date),
  );
  const eligibleDays = new Set([...days, ...restDaySet]);

  let streak = 0;
  const cursor = new Date();
  if (!eligibleDays.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (eligibleDays.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const loggedToday = days.has(dateKey(new Date()));
  const bestStreak  = longestConsecutiveStreak(dayKeys);

  // Goal progress
  let goalProgress = null;
  let toGoalKg = null;
  if (goal && current != null && start != null) {
    const denom = start - goal.targetWeightKg;
    goalProgress = denom !== 0 ? clamp((start - current) / denom, 0, 1) : 1;
    toGoalKg = current - goal.targetWeightKg;
  }

  const todayKey2 = dateKey(new Date());
  const today = logs.find((l) => l.date === todayKey2) || { calories: 0, water: 0, steps: 0 };

  return {
    current, previous, start, earliest,
    lastChange, totalChange,
    streak, loggedToday, bestStreak,
    goalProgress, toGoalKg,
    today,
    totalEntries: sorted.length,
    totalPhotos:  photos.length,
    sorted,
  };
}

// Group weigh-ins into ISO weeks (Mon-start) and average them.
export function weeklyAverages(weights = []) {
  const map = new Map();
  for (const w of weights) {
    const d = new Date(w.date);
    const dayIdx = (d.getDay() + 6) % 7;
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

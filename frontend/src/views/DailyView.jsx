import { useEffect, useState, useMemo } from "react";
import { Flame, Droplets, Footprints, Minus, Plus, Tent } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useApp } from "../contexts/AppContext";
import { upsertDailyLog } from "../lib/data";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Build a 12-week heatmap grid (Mon–Sun, most recent week on right)
function buildHeatmap(logs) {
  const cells = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const logSet = new Set(logs.map((l) => l.id || l.date));

  // Go back to the Monday 11 weeks ago
  const dayOfWeek = (today.getDay() + 6) % 7; // 0=Mon
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - dayOfWeek - 11 * 7);

  for (let i = 0; i < 12 * 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const isFuture = d > today;
    cells.push({
      key,
      logged: logSet.has(key),
      isFuture,
      isToday: key === today.toISOString().slice(0, 10),
    });
  }
  return cells;
}

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

export default function DailyView() {
  const { uid, logs, profile, updateProfile } = useApp();
  const key = todayKey();
  const todayLog = logs.find((l) => l.id === key) || {};

  const waterGoal = profile?.waterGoal || 8;

  const [calories, setCalories] = useState(0);
  const [water, setWater]       = useState(0);
  const [steps, setSteps]       = useState(0);
  const [restDay, setRestDay]   = useState(false);
  const [editingWaterGoal, setEditingWaterGoal] = useState(false);
  const [waterGoalInput, setWaterGoalInput]     = useState(waterGoal);

  useEffect(() => {
    setCalories(todayLog.calories || 0);
    setWater(todayLog.water || 0);
    setSteps(todayLog.steps || 0);
    setRestDay(todayLog.restDay || false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayLog.calories, todayLog.water, todayLog.steps, todayLog.restDay]);

  const save = async (patch) => {
    try {
      await upsertDailyLog(uid, key, patch);
    } catch {
      toast.error("Could not save");
    }
  };

  const bumpWater = (delta) => {
    const next = Math.max(0, water + delta);
    setWater(next);
    save({ water: next });
  };

  const toggleRestDay = async () => {
    const next = !restDay;
    setRestDay(next);
    await save({ restDay: next });
    toast.success(next ? "Rest day marked — your streak is protected 🛡️" : "Rest day removed");
  };

  const saveWaterGoal = () => {
    const g = Math.max(1, Math.min(30, Number(waterGoalInput) || 8));
    updateProfile({ waterGoal: g });
    setEditingWaterGoal(false);
    toast.success(`Water goal set to ${g} glasses`);
  };

  const recent = logs.filter((l) => l.id !== key).slice(0, 7);
  const heatmap = useMemo(() => buildHeatmap(logs), [logs]);

  return (
    <div className="space-y-6" data-testid="daily-view">
      <div>
        <h1 className="font-heading text-3xl font-black tracking-tighter">Daily habits</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Calories */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[var(--radius)] border bg-card p-6"
          data-testid="tracker-calories"
        >
          <div className="flex items-center gap-2 text-primary">
            <Flame className="h-5 w-5" />
            <span className="font-semibold">Calories</span>
          </div>
          <input
            type="number" inputMode="numeric"
            data-testid="calories-input"
            value={calories || ""}
            onChange={(e) => setCalories(Number(e.target.value) || 0)}
            onBlur={() => save({ calories })}
            placeholder="0"
            className="metric-font mt-4 w-full bg-transparent text-4xl font-black outline-none"
          />
          <p className="text-xs text-muted-foreground">kcal eaten today</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[200, 400, 600].map((q) => (
              <button
                key={q} data-testid={`calories-quick-${q}`}
                onClick={() => { const n = calories + q; setCalories(n); save({ calories: n }); }}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
              >
                +{q}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Water */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-[var(--radius)] border bg-card p-6"
          data-testid="tracker-water"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Droplets className="h-5 w-5" />
              <span className="font-semibold">Water</span>
            </div>
            <button
              onClick={() => { setWaterGoalInput(waterGoal); setEditingWaterGoal(true); }}
              className="text-xs text-muted-foreground underline hover:text-foreground"
              data-testid="edit-water-goal-btn"
            >
              Set goal
            </button>
          </div>

          {editingWaterGoal ? (
            <div className="mt-4 flex items-center gap-2">
              <input
                type="number" min="1" max="30"
                data-testid="water-goal-input"
                value={waterGoalInput}
                onChange={(e) => setWaterGoalInput(e.target.value)}
                className="w-20 rounded-[var(--radius)] border border-input bg-background px-2 py-1 text-sm outline-none focus:border-primary"
              />
              <span className="text-sm text-muted-foreground">glasses</span>
              <button onClick={saveWaterGoal} className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Save</button>
              <button onClick={() => setEditingWaterGoal(false)} className="text-xs text-muted-foreground">Cancel</button>
            </div>
          ) : (
            <>
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => bumpWater(-1)} data-testid="water-minus"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="text-center">
                  <div className="metric-font text-4xl font-black" data-testid="water-count">{water}</div>
                  <div className="text-xs text-muted-foreground">/ {waterGoal} glasses</div>
                </div>
                <button
                  onClick={() => bumpWater(1)} data-testid="water-plus"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex gap-1">
                {Array.from({ length: waterGoal }).map((_, i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${i < water ? "bg-primary" : "bg-muted"}`} />
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-[var(--radius)] border bg-card p-6"
          data-testid="tracker-steps"
        >
          <div className="flex items-center gap-2 text-primary">
            <Footprints className="h-5 w-5" />
            <span className="font-semibold">Steps</span>
          </div>
          <input
            type="number" inputMode="numeric"
            data-testid="steps-input"
            value={steps || ""}
            onChange={(e) => setSteps(Number(e.target.value) || 0)}
            onBlur={() => save({ steps })}
            placeholder="0"
            className="metric-font mt-4 w-full bg-transparent text-4xl font-black outline-none"
          />
          <p className="text-xs text-muted-foreground">of 10,000 goal</p>
          <div className="mt-4 h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (steps / 10000) * 100)}%` }}
            />
          </div>
        </motion.div>
      </div>

      {/* Streak Freeze / Rest Day */}
      <div className="rounded-[var(--radius)] border bg-card p-5" data-testid="rest-day-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
              restDay ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              <Tent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Rest day</p>
              <p className="text-xs text-muted-foreground">
                {restDay
                  ? "Today is marked as a rest day — your streak is protected 🛡️"
                  : "Mark today as a rest day to protect your logging streak"}
              </p>
            </div>
          </div>
          <button
            onClick={toggleRestDay}
            data-testid="rest-day-toggle"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              restDay ? "bg-primary" : "bg-muted-foreground/30"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              restDay ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>
      </div>

      {/* 12-week heatmap */}
      <div className="rounded-[var(--radius)] border bg-card p-6" data-testid="log-heatmap">
        <h2 className="font-heading mb-4 text-lg font-bold">Logging consistency</h2>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {/* Day labels column */}
          <div className="flex flex-col gap-1 pr-1">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="h-3 w-7 text-right text-[9px] leading-3 text-muted-foreground">{d}</div>
            ))}
          </div>
          {/* Week columns */}
          {Array.from({ length: 12 }).map((_, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {heatmap.slice(weekIdx * 7, weekIdx * 7 + 7).map((cell) => (
                <div
                  key={cell.key}
                  title={cell.key}
                  className={`h-3 w-3 rounded-sm transition-colors ${
                    cell.isFuture
                      ? "bg-muted/30"
                      : cell.isToday
                        ? cell.logged ? "bg-primary ring-1 ring-primary ring-offset-1" : "bg-muted ring-1 ring-muted-foreground/40 ring-offset-1"
                        : cell.logged
                          ? "bg-primary"
                          : "bg-muted"
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          <div className="h-2.5 w-2.5 rounded-sm bg-muted" /><span>Missed</span>
          <div className="ml-2 h-2.5 w-2.5 rounded-sm bg-primary" /><span>Logged</span>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="rounded-[var(--radius)] border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-heading text-lg font-bold">Recent days</h2>
          </div>
          <ul className="divide-y divide-border">
            {recent.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between px-6 py-3 text-sm"
                data-testid="daily-row"
              >
                <span className="text-muted-foreground">
                  {new Date(l.id).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </span>
                <div className="flex items-center gap-4">
                  {l.restDay && <span className="text-xs text-primary font-medium">Rest day 🛡️</span>}
                  <span className="flex gap-4">
                    <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-muted-foreground" />{l.calories || 0}</span>
                    <span className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5 text-muted-foreground" />{l.water || 0}</span>
                    <span className="flex items-center gap-1"><Footprints className="h-3.5 w-3.5 text-muted-foreground" />{(l.steps || 0).toLocaleString()}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

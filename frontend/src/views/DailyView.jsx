import { useEffect, useState } from "react";
import { Flame, Droplets, Footprints, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useApp } from "../contexts/AppContext";
import { upsertDailyLog } from "../lib/data";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function DailyView() {
  const { uid, logs } = useApp();
  const key = todayKey();
  const todayLog = logs.find((l) => l.id === key) || {};

  const [calories, setCalories] = useState(0);
  const [water, setWater] = useState(0);
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    setCalories(todayLog.calories || 0);
    setWater(todayLog.water || 0);
    setSteps(todayLog.steps || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayLog.calories, todayLog.water, todayLog.steps]);

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

  const recent = logs.filter((l) => l.id !== key).slice(0, 7);

  return (
    <div className="space-y-6" data-testid="daily-view">
      <div>
        <h1 className="font-heading text-3xl font-black tracking-tighter">
          Daily habits
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Calories */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[var(--radius)] border bg-card p-6"
          data-testid="tracker-calories"
        >
          <div className="flex items-center gap-2 text-primary">
            <Flame className="h-5 w-5" />
            <span className="font-semibold">Calories</span>
          </div>
          <input
            type="number"
            inputMode="numeric"
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
                key={q}
                data-testid={`calories-quick-${q}`}
                onClick={() => {
                  const n = calories + q;
                  setCalories(n);
                  save({ calories: n });
                }}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
              >
                +{q}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Water */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-[var(--radius)] border bg-card p-6"
          data-testid="tracker-water"
        >
          <div className="flex items-center gap-2 text-primary">
            <Droplets className="h-5 w-5" />
            <span className="font-semibold">Water</span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => bumpWater(-1)}
              data-testid="water-minus"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="text-center">
              <div className="metric-font text-4xl font-black" data-testid="water-count">
                {water}
              </div>
              <div className="text-xs text-muted-foreground">/ 8 glasses</div>
            </div>
            <button
              onClick={() => bumpWater(1)}
              data-testid="water-plus"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i < water ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[var(--radius)] border bg-card p-6"
          data-testid="tracker-steps"
        >
          <div className="flex items-center gap-2 text-primary">
            <Footprints className="h-5 w-5" />
            <span className="font-semibold">Steps</span>
          </div>
          <input
            type="number"
            inputMode="numeric"
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
                  {new Date(l.id).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="flex gap-4">
                  <span className="flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-muted-foreground" />
                    {l.calories || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Droplets className="h-3.5 w-3.5 text-muted-foreground" />
                    {l.water || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Footprints className="h-3.5 w-3.5 text-muted-foreground" />
                    {(l.steps || 0).toLocaleString()}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

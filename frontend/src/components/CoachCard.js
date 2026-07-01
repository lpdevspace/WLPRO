import { useCallback, useEffect, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "../contexts/AppContext";
import { getCoachMessage } from "../lib/coach";
import { fetchCoachTip } from "../lib/coachApi";
import { toDisplay } from "../lib/units";
import { forecastGoal, detectPlateau } from "../lib/health";

export default function CoachCard() {
  const { stats, unit, goal, profile, weights } = useApp();
  const fallback = getCoachMessage(stats, unit, goal);

  const [aiMsg, setAiMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const buildPayload = useCallback(() => {
    const num = (v) => (v == null ? null : Number(toDisplay(v, unit).toFixed(1)));
    const fc = forecastGoal(weights, goal);
    const plateau = detectPlateau(weights, stats.goalProgress);
    return {
      unit,
      current: num(stats.current),
      total_change: num(stats.totalChange),
      last_change: num(stats.lastChange),
      streak: stats.streak,
      logged_today: stats.loggedToday,
      goal_progress: stats.goalProgress,
      to_goal: num(stats.toGoalKg),
      goal_target: goal ? num(goal.targetWeightKg) : null,
      calories: stats.today.calories || 0,
      water: stats.today.water || 0,
      steps: stats.today.steps || 0,
      total_entries: stats.totalEntries,
      name: (profile?.displayName || "").split(" ")[0] || null,
      rate_per_week: fc ? Number(toDisplay(fc.ratePerWeek, unit).toFixed(2)) : null,
      eta_weeks: fc && fc.status === "ontrack" ? Number(fc.weeks.toFixed(1)) : null,
      plateau: plateau.plateau,
    };
  }, [stats, unit, goal, profile, weights]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const tip = await fetchCoachTip(buildPayload());
      setAiMsg(tip || null);
    } catch {
      setAiMsg(null); // graceful fallback to rule-based message
    } finally {
      setLoading(false);
    }
  }, [buildPayload]);

  // Regenerate when the meaningful data changes.
  const sig = `${stats.current}|${stats.streak}|${stats.totalEntries}|${stats.today.calories}|${stats.today.water}|${stats.today.steps}|${stats.goalProgress}`;
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const body = aiMsg || fallback.message;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-[var(--radius)] border border-primary/30 bg-gradient-to-br from-primary/15 to-transparent p-6"
      data-testid="coach-card"
    >
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
      <div className="relative flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {aiMsg ? "AI Coach" : "Your Coach"}
            </p>
            <button
              onClick={load}
              disabled={loading}
              data-testid="coach-refresh"
              className="text-primary/70 transition-colors hover:text-primary disabled:opacity-50"
              title="New tip"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <h3 className="font-heading mt-1 text-lg font-bold" data-testid="coach-headline">
            {fallback.headline}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="coach-message">
            {body}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

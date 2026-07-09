import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "../contexts/AppContext";
import { getCoachMessage } from "../lib/coach";
import { fetchCoachTip } from "../lib/coachApi";
import { toDisplay } from "../lib/units";
import { forecastGoal, detectPlateau } from "../lib/health";

const COOLDOWN_MS = 30_000;

// Category → Tailwind accent classes
const CATEGORY_STYLES = {
  warning:      { border: "border-amber-400/50",  bg: "from-amber-400/10",  dot: "bg-amber-400/20 text-amber-500",  label: "text-amber-500" },
  celebration:  { border: "border-emerald-400/50", bg: "from-emerald-400/10", dot: "bg-emerald-400/20 text-emerald-500", label: "text-emerald-500" },
  encouragement:{ border: "border-sky-400/50",    bg: "from-sky-400/10",    dot: "bg-sky-400/20 text-sky-500",    label: "text-sky-500" },
  neutral:      { border: "border-primary/30",    bg: "from-primary/15",    dot: "bg-primary/20 text-primary",    label: "text-primary" },
};

export default function CoachCard() {
  const { stats, unit, goal, profile, weights } = useApp();
  const fallback = getCoachMessage(stats, unit, goal);

  const [aiTip, setAiTip]     = useState(null); // { message, mood, emoji, category }
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const cooldownTimer = useRef(null);

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

  const load = useCallback(async (isManual = false) => {
    if (isManual && cooldown) return;
    setLoading(true);
    if (isManual) {
      setCooldown(true);
      clearTimeout(cooldownTimer.current);
      cooldownTimer.current = setTimeout(() => setCooldown(false), COOLDOWN_MS);
    }
    try {
      const tip = await fetchCoachTip(buildPayload());
      setAiTip(tip || null);
    } catch {
      setAiTip(null);
    } finally {
      setLoading(false);
    }
  }, [buildPayload, cooldown]);

  const sig = `${stats.current}|${stats.streak}|${stats.totalEntries}|${stats.today.calories}|${stats.today.water}|${stats.today.steps}|${stats.goalProgress}`;
  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const category = aiTip?.category || "neutral";
  const styles = CATEGORY_STYLES[category] || CATEGORY_STYLES.neutral;
  const body   = aiTip?.message || fallback.message;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-[var(--radius)] border ${styles.border} bg-gradient-to-br ${styles.bg} to-transparent p-6 transition-colors duration-500`}
      data-testid="coach-card"
    >
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
      <div className="relative flex items-start gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${styles.dot}`}>
          {aiTip?.emoji
            ? <span className="text-xl leading-none">{aiTip.emoji}</span>
            : <Sparkles className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-xs font-semibold uppercase tracking-wider ${styles.label}`}>
              {aiTip ? (aiTip.mood || "AI Coach") : "Your Coach"}
            </p>
            <button
              onClick={() => load(true)}
              disabled={loading || cooldown}
              data-testid="coach-refresh"
              className="flex items-center gap-1 text-primary/70 transition-colors hover:text-primary disabled:opacity-40"
              title={cooldown ? "Please wait before refreshing again" : "New tip"}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {cooldown && <span className="text-xs">wait…</span>}
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

import { motion } from "framer-motion";
import {
  Scale,
  Flame,
  TrendingDown,
  Target,
  Footprints,
  Droplets,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import StatCard from "../components/StatCard";
import CoachCard from "../components/CoachCard";
import ProgressRing from "../components/ProgressRing";
import WeightChart from "../components/WeightChart";
import AddWeightDialog from "../components/AddWeightDialog";
import BMICard from "../components/BMICard";
import ForecastCard from "../components/ForecastCard";
import { formatWeight } from "../lib/units";
import { detectPlateau } from "../lib/health";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { profile, stats, unit, goal, weights } = useApp();
  const name = (profile?.displayName || "").split(" ")[0] || "there";
  const plateau = detectPlateau(weights, stats.goalProgress);

  const changeLabel =
    stats.totalChange == null
      ? "Log to begin"
      : `${stats.totalChange <= 0 ? "▼" : "▲"} ${formatWeight(
          Math.abs(stats.totalChange),
          unit,
        )} since start`;

  return (
    <div className="space-y-6" data-testid="dashboard">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()},</p>
          <h1 className="font-heading text-3xl font-black tracking-tighter sm:text-4xl">
            {name} 👋
          </h1>
        </div>
        <AddWeightDialog />
      </div>

      <CoachCard />

      {plateau.plateau && (
        <div
          className="flex items-start gap-3 rounded-[var(--radius)] border border-amber-500/40 bg-amber-500/10 p-4"
          data-testid="plateau-banner"
        >
          <TrendingDown className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="font-heading text-sm font-bold">You've hit a plateau</p>
            <p className="text-sm text-muted-foreground">
              Your weight has barely moved in ~2 weeks. Plateaus are normal — try shaking
              up your routine: adjust calories slightly, add steps, or prioritize sleep.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {/* Goal ring hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-1 flex flex-col items-center justify-center rounded-[var(--radius)] border bg-card p-8 md:col-span-2 lg:col-span-2 lg:row-span-2"
          data-testid="goal-ring-card"
        >
          <ProgressRing
            value={stats.goalProgress ?? 0}
            testId="goal-progress-ring"
          >
            <span className="metric-font text-3xl font-black">
              {goal && stats.goalProgress != null
                ? `${Math.round(stats.goalProgress * 100)}%`
                : "—"}
            </span>
            <span className="text-xs text-muted-foreground">to goal</span>
          </ProgressRing>
          <div className="mt-4 text-center">
            {goal ? (
              <p className="text-sm text-muted-foreground">
                Target{" "}
                <span className="font-semibold text-foreground">
                  {formatWeight(goal.targetWeightKg, unit)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Set a goal in Settings to track progress
              </p>
            )}
          </div>
        </motion.div>

        <StatCard
          testId="stat-current"
          className="md:col-span-2 lg:col-span-2"
          icon={Scale}
          label="Current weight"
          accent
          value={stats.current != null ? formatWeight(stats.current, unit) : "—"}
          sub={changeLabel}
        />
        <StatCard
          testId="stat-streak"
          className="md:col-span-2 lg:col-span-2"
          icon={Flame}
          label="Logging streak"
          value={`${stats.streak} ${stats.streak === 1 ? "day" : "days"}`}
          sub={stats.loggedToday ? "Logged today ✓" : "Log today to extend it"}
        />
        <StatCard
          testId="stat-todo"
          className="md:col-span-2 lg:col-span-2"
          icon={TrendingDown}
          label="Entries"
          value={stats.totalEntries}
          sub={`${stats.totalPhotos} progress photo${stats.totalPhotos === 1 ? "" : "s"}`}
        />
        <StatCard
          testId="stat-steps"
          className="md:col-span-1 lg:col-span-1"
          icon={Footprints}
          label="Steps today"
          value={(stats.today.steps || 0).toLocaleString()}
        />
        <StatCard
          testId="stat-water"
          className="md:col-span-1 lg:col-span-1"
          icon={Droplets}
          label="Water today"
          value={`${stats.today.water || 0}`}
          sub="glasses"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BMICard />
        <ForecastCard />
      </div>

      <div className="rounded-[var(--radius)] border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-lg font-bold">Weight trend</h2>
        </div>
        <WeightChart />
      </div>
    </div>
  );
}

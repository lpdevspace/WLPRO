import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { CalendarRange, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useThemeColor } from "../hooks/useThemeColor";
import { weeklyAverages } from "../lib/stats";
import { toDisplay, unitLabel, formatWeight } from "../lib/units";

function safeDateLabel(weekStart) {
  if (!weekStart) return "";
  const d = new Date(weekStart);
  if (isNaN(d.getTime())) return weekStart;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function WeeklyAverages() {
  const { weights, unit, theme, accent } = useApp();
  const primary = useThemeColor("--primary", [theme, accent]);
  const muted = useThemeColor("--muted-foreground", [theme]);
  const border = useThemeColor("--border", [theme]);
  const cardBg = useThemeColor("--card", [theme]);

  const weeks = useMemo(() => weeklyAverages(weights), [weights]);

  const data = weeks
    .filter((w) => w.weekStart)
    .map((w) => ({
      label: safeDateLabel(w.weekStart),
      value: Number(toDisplay(w.avgKg, unit).toFixed(1)),
    }));

  const lastDelta =
    weeks.length >= 2
      ? weeks[weeks.length - 1].avgKg - weeks[weeks.length - 2].avgKg
      : null;

  const DeltaIcon =
    lastDelta == null ? Minus : lastDelta < -0.05 ? TrendingDown : lastDelta > 0.05 ? TrendingUp : Minus;

  return (
    <div className="rounded-[var(--radius)] border bg-card p-6" data-testid="weekly-averages">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-lg font-bold">Weekly average</h2>
        </div>
        {lastDelta != null && (
          <span
            className={`flex items-center gap-1 text-sm font-semibold ${
              lastDelta <= 0.05 ? "text-primary" : "text-muted-foreground"
            }`}
            data-testid="weekly-delta"
          >
            <DeltaIcon className="h-4 w-4" />
            {formatWeight(Math.abs(lastDelta), unit)} vs last week
          </span>
        )}
      </div>

      {data.length < 2 ? (
        <p className="py-8 text-center text-sm text-muted-foreground" data-testid="weekly-empty">
          Log weigh-ins across at least two weeks to see your smoothed weekly trend —
          it cuts through day-to-day noise.
        </p>
      ) : (
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="wavg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={primary} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={border} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: muted, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis domain={["auto", "auto"]} tick={{ fill: muted, fontSize: 12 }} axisLine={false} tickLine={false} width={48} unit={` ${unitLabel(unit)}`} />
              <Tooltip
                contentStyle={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
                labelStyle={{ color: muted }}
                formatter={(v) => [`${v} ${unitLabel(unit)}`, "Weekly avg"]}
              />
              <Area type="monotone" dataKey="value" stroke={primary} strokeWidth={3} fill="url(#wavg)" dot={{ r: 3, fill: primary }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { useApp } from "../contexts/AppContext";
import { useThemeColor } from "../hooks/useThemeColor";
import { toDisplay, unitLabel } from "../lib/units";

function safeDateLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function WeightChart({ height = 280 }) {
  const { weights, unit, goal, theme, accent } = useApp();
  const primary = useThemeColor("--primary", [theme, accent]);
  const muted = useThemeColor("--muted-foreground", [theme]);
  const cardBg = useThemeColor("--card", [theme]);
  const border = useThemeColor("--border", [theme]);

  // Filter out any corrupt docs missing a date field before rendering
  const validWeights = weights.filter((w) => w.date);

  const data = validWeights.map((w) => ({
    date: safeDateLabel(w.date),
    value: Number(toDisplay(w.weightKg, unit).toFixed(1)),
  }));

  const target =
    goal?.targetWeightKg != null
      ? Number(toDisplay(goal.targetWeightKg, unit).toFixed(1))
      : null;

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
        data-testid="weight-chart-empty"
      >
        Log a couple of weigh-ins to see your trend here.
      </div>
    );
  }

  return (
    <div data-testid="weight-chart" style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primary} stopOpacity={0.35} />
              <stop offset="100%" stopColor={primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={border} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: muted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: muted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={48}
            unit={` ${unitLabel(unit)}`}
          />
          <Tooltip
            contentStyle={{
              background: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 12,
              color: "inherit",
            }}
            labelStyle={{ color: muted }}
            formatter={(v) => [`${v} ${unitLabel(unit)}`, "Weight"]}
          />
          {target != null && (
            <ReferenceLine
              y={target}
              stroke={primary}
              strokeDasharray="6 6"
              strokeOpacity={0.6}
              label={{ value: "Goal", fill: muted, fontSize: 11, position: "right" }}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={primary}
            strokeWidth={3}
            fill="url(#wfill)"
            dot={{ r: 3, fill: primary, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

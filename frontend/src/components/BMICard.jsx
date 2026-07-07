import { Link } from "react-router-dom";
import { Activity } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { computeBMI, bmiCategory, healthyWeightRange, computeTDEE } from "../lib/health";
import { formatWeight } from "../lib/units";

const TONE = {
  low:  "text-blue-500",
  good: "text-primary",
  warn: "text-amber-500",
  high: "text-destructive",
};

function markerPct(bmi) {
  const clamped = Math.max(15, Math.min(35, bmi));
  return ((clamped - 15) / 20) * 100;
}

export default function BMICard() {
  const { profile, stats, unit } = useApp();
  const heightCm = profile?.heightCm;
  const bmi  = computeBMI(stats.current, heightCm);
  const cat  = bmiCategory(bmi);
  const range = healthyWeightRange(heightCm);

  // TDEE — uses profile age/sex if available, falls back to neutral estimate
  const tdee = computeTDEE(
    stats.current,
    heightCm,
    profile?.ageYears || 30,
    profile?.sex || "neutral",
    1.375,
  );

  return (
    <div className="rounded-[var(--radius)] border bg-card p-6" data-testid="bmi-card">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-lg font-bold">BMI &amp; Daily Calories</h2>
      </div>

      {!heightCm ? (
        <div className="py-4 text-sm text-muted-foreground" data-testid="bmi-no-height">
          Add your height in{" "}
          <Link to="/app/settings" className="font-semibold text-primary underline">
            Settings
          </Link>{" "}
          to unlock BMI &amp; calorie insights.
        </div>
      ) : bmi == null ? (
        <div className="py-4 text-sm text-muted-foreground">
          Log a weigh-in to calculate your BMI.
        </div>
      ) : (
        <>
          <div className="flex items-end gap-6">
            <div>
              <div className="flex items-end gap-2">
                <span className="metric-font text-4xl font-black" data-testid="bmi-value">
                  {bmi.toFixed(1)}
                </span>
                <span className={`mb-1 font-semibold ${TONE[cat.tone]}`} data-testid="bmi-category">
                  {cat.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">BMI</p>
            </div>
            {tdee && (
              <div>
                <div className="metric-font text-4xl font-black" data-testid="tdee-value">
                  {tdee.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">est. maintenance kcal/day</p>
              </div>
            )}
          </div>

          {/* BMI scale */}
          <div className="relative mt-5 h-2 w-full rounded-full bg-gradient-to-r from-blue-400 via-primary to-destructive">
            <div
              className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded-full bg-foreground ring-2 ring-card"
              style={{ left: `${markerPct(bmi)}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>15</span><span>18.5</span><span>25</span><span>30</span><span>35</span>
          </div>

          {range && (
            <p className="mt-4 text-sm text-muted-foreground" data-testid="bmi-range">
              Healthy weight for your height:{" "}
              <span className="font-semibold text-foreground">
                {formatWeight(range.minKg, unit, 0)} – {formatWeight(range.maxKg, unit, 0)}
              </span>
            </p>
          )}
        </>
      )}
    </div>
  );
}

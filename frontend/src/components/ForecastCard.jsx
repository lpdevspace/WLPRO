import { Link } from "react-router-dom";
import { Rocket, TrendingDown, TrendingUp, Minus, CalendarClock } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { forecastGoal } from "../lib/health";
import { formatWeight } from "../lib/units";

export default function ForecastCard() {
  const { weights, goal, unit } = useApp();
  const fc = forecastGoal(weights, goal);

  const ratePill = (perWeekKg) => {
    const Icon = perWeekKg < -0.02 ? TrendingDown : perWeekKg > 0.02 ? TrendingUp : Minus;
    return (
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {formatWeight(Math.abs(perWeekKg), unit)}/week
      </span>
    );
  };

  let body;
  if (!goal) {
    body = (
      <p className="text-sm text-muted-foreground" data-testid="forecast-no-goal">
        Set a target weight to forecast when you'll reach it.{" "}
        <Link to="/app/settings" className="font-semibold text-primary underline">
          Set a goal
        </Link>
      </p>
    );
  } else if (!fc) {
    body = (
      <p className="text-sm text-muted-foreground" data-testid="forecast-nodata">
        Log a few more weigh-ins and we'll project your goal date.
      </p>
    );
  } else if (fc.status === "reached") {
    body = (
      <p className="text-sm font-semibold text-primary" data-testid="forecast-reached">
        You've reached your goal — incredible work! 🎉
      </p>
    );
  } else if (fc.status === "ontrack" && fc.etaDate) {
    body = (
      <div data-testid="forecast-ontrack">
        <p className="metric-font text-2xl font-black">
          {fc.etaDate.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Projected to hit {formatWeight(goal.targetWeightKg, unit)} at your current pace.
        </p>
        <div className="mt-2">{ratePill(fc.ratePerWeek)}</div>
      </div>
    );
  } else if (fc.status === "flat") {
    body = (
      <p className="text-sm text-muted-foreground" data-testid="forecast-flat">
        Your weight is holding steady. A small tweak to habits will get you moving toward
        your goal again.
      </p>
    );
  } else {
    body = (
      <p className="text-sm text-muted-foreground" data-testid="forecast-away">
        You're currently trending away from your target — no worries, small consistent
        changes flip this fast. {ratePill(fc.ratePerWeek)}
      </p>
    );
  }

  return (
    <div className="rounded-[var(--radius)] border bg-card p-6" data-testid="forecast-card">
      <div className="mb-4 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-lg font-bold">Goal forecast</h2>
      </div>
      {body}
    </div>
  );
}

import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../contexts/AppContext";
import WeightChart from "../components/WeightChart";
import WeeklyAverages from "../components/WeeklyAverages";
import AddWeightDialog from "../components/AddWeightDialog";
import { deleteWeight } from "../lib/data";
import { formatWeight } from "../lib/units";

export default function WeightView() {
  const { uid, weights, unit } = useApp();
  const reversed = [...weights].reverse();

  const remove = async (id) => {
    try {
      await deleteWeight(uid, id);
      toast.success("Entry removed");
    } catch {
      toast.error("Could not delete");
    }
  };

  const diffFromPrev = (idx) => {
    // reversed: idx 0 is newest. previous chronological is idx+1.
    const cur = reversed[idx];
    const prev = reversed[idx + 1];
    if (!prev) return null;
    return cur.weightKg - prev.weightKg;
  };

  return (
    <div className="space-y-6" data-testid="weight-view">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tighter">
            Weight
          </h1>
          <p className="text-sm text-muted-foreground">
            Your full weigh-in history and trend.
          </p>
        </div>
        <AddWeightDialog />
      </div>

      <div className="rounded-[var(--radius)] border bg-card p-6">
        <WeightChart height={320} />
      </div>

      <WeeklyAverages />

      <div className="rounded-[var(--radius)] border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-heading text-lg font-bold">History</h2>
        </div>
        {reversed.length === 0 ? (
          <div
            className="px-6 py-12 text-center text-sm text-muted-foreground"
            data-testid="weight-history-empty"
          >
            No weigh-ins yet. Tap “Log weight” to add your first.
          </div>
        ) : (
          <ul className="divide-y divide-border" data-testid="weight-history">
            {reversed.map((w, idx) => {
              const d = diffFromPrev(idx);
              return (
                <li
                  key={w.id}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                  data-testid="weight-row"
                >
                  <div>
                    <p className="metric-font text-lg font-bold">
                      {formatWeight(w.weightKg, unit)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(w.date).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {w.note ? ` · ${w.note}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {d != null && (
                      <span
                        className={`text-sm font-semibold ${
                          d <= 0 ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {d <= 0 ? "▼" : "▲"} {formatWeight(Math.abs(d), unit)}
                      </span>
                    )}
                    <button
                      onClick={() => remove(w.id)}
                      data-testid={`delete-weight-${w.id}`}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

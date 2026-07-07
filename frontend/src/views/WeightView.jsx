import { useState } from "react";
import { Trash2, Pencil, StickyNote, Search, X } from "lucide-react";
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
  const [editing, setEditing] = useState(null);
  const [search, setSearch]   = useState("");

  const filtered = search.trim()
    ? reversed.filter(
        (w) =>
          (w.note || "").toLowerCase().includes(search.toLowerCase()) ||
          w.date.includes(search),
      )
    : reversed;

  const remove = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await deleteWeight(uid, id);
      toast.success("Entry removed");
    } catch {
      toast.error("Could not delete");
    }
  };

  const diffFromPrev = (idx) => {
    // diff relative to position in full reversed array, not filtered
    const fullIdx = reversed.findIndex((w) => w.id === filtered[idx]?.id);
    const cur  = reversed[fullIdx];
    const prev = reversed[fullIdx + 1];
    if (!cur || !prev) return null;
    return cur.weightKg - prev.weightKg;
  };

  return (
    <div className="space-y-6" data-testid="weight-view">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tighter">Weight</h1>
          <p className="text-sm text-muted-foreground">Your full weigh-in history and trend.</p>
        </div>
        <AddWeightDialog />
      </div>

      <div className="rounded-[var(--radius)] border bg-card p-6">
        <WeightChart />
      </div>

      <WeeklyAverages />

      <div className="rounded-[var(--radius)] border bg-card" data-testid="weight-history">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-heading text-lg font-bold">History</h2>
          {/* Search bar */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              data-testid="weight-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes or date…"
              className="h-9 rounded-full border border-input bg-background pl-9 pr-8 text-sm outline-none focus:border-primary w-52"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 text-muted-foreground hover:text-foreground"
                data-testid="clear-search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            {search ? `No entries matching "${search}"` : "No entries yet — log your first weigh-in above."}
          </div>
        ) : (
          <ul>
            {filtered.map((w, idx) => {
              const diff = diffFromPrev(idx);
              return (
                <li
                  key={w.id}
                  className="flex items-center gap-3 border-b px-6 py-3 last:border-0 hover:bg-muted/30 transition-colors"
                  data-testid="weight-row"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="metric-font font-bold tabular-nums">
                        {formatWeight(w.weightKg, unit)}
                      </span>
                      {diff !== null && (
                        <span className={`text-xs font-semibold ${
                          diff < 0 ? "text-green-500" : diff > 0 ? "text-red-500" : "text-muted-foreground"
                        }`}>
                          {diff > 0 ? "+" : ""}{formatWeight(Math.abs(diff), unit)}
                          {diff < 0 ? " ▼" : diff > 0 ? " ▲" : ""}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        {new Date(w.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      {w.note && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground italic" title={w.note}>
                          <StickyNote className="h-3 w-3" />
                          <span className="max-w-[200px] truncate">{w.note}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditing(w)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title="Edit"
                      data-testid={`edit-weight-${w.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(w.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Delete"
                      data-testid={`delete-weight-${w.id}`}
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

      {editing && (
        <AddWeightDialog existing={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

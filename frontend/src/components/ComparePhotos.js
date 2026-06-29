import { useEffect, useMemo, useState } from "react";
import { GitCompareArrows } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { formatWeight } from "../lib/units";

function PhotoSelect({ value, onChange, photos, unit, testId }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-testid={testId}
      className="w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
    >
      {photos.map((p) => (
        <option key={p.id} value={p.id}>
          {new Date(p.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          {p.weightKg != null ? ` · ${formatWeight(p.weightKg, unit)}` : ""}
        </option>
      ))}
    </select>
  );
}

export default function ComparePhotos() {
  const { photos, unit } = useApp();
  // photos arrive newest-first
  const oldest = photos[photos.length - 1];
  const newest = photos[0];

  const [beforeId, setBeforeId] = useState(oldest?.id);
  const [afterId, setAfterId] = useState(newest?.id);
  const [pos, setPos] = useState(50);

  useEffect(() => {
    setBeforeId(oldest?.id);
    setAfterId(newest?.id);
  }, [oldest?.id, newest?.id]);

  const before = useMemo(() => photos.find((p) => p.id === beforeId), [photos, beforeId]);
  const after = useMemo(() => photos.find((p) => p.id === afterId), [photos, afterId]);

  if (photos.length < 2 || !before || !after) return null;

  return (
    <div className="rounded-[var(--radius)] border bg-card p-6" data-testid="compare-photos">
      <div className="mb-4 flex items-center gap-2">
        <GitCompareArrows className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-lg font-bold">Before / After</h2>
      </div>

      <div
        className="relative mx-auto aspect-[3/4] w-full max-w-sm select-none overflow-hidden rounded-[var(--radius)] border"
        data-testid="compare-stage"
      >
        {/* After image (base, right side) */}
        <img
          src={after.dataUrl}
          alt="after"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Before image clipped to the left portion */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <img
            src={before.dataUrl}
            alt="before"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        {/* Labels */}
        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
          {new Date(before.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
        <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
          {new Date(after.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
        {/* Divider handle */}
        <div
          className="absolute inset-y-0 w-0.5 bg-primary"
          style={{ left: `${pos}%` }}
        >
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">
            ↔
          </div>
        </div>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={pos}
        data-testid="compare-slider"
        onChange={(e) => setPos(Number(e.target.value))}
        className="mt-4 w-full max-w-sm cursor-ew-resize accent-primary"
        style={{ marginInline: "auto", display: "block" }}
      />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Before</p>
          <PhotoSelect value={beforeId} onChange={setBeforeId} photos={photos} unit={unit} testId="compare-before-select" />
        </div>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">After</p>
          <PhotoSelect value={afterId} onChange={setAfterId} photos={photos} unit={unit} testId="compare-after-select" />
        </div>
      </div>

      {before.weightKg != null && after.weightKg != null && (
        <p className="mt-4 text-center text-sm" data-testid="compare-delta">
          <span className="font-semibold text-primary">
            {formatWeight(Math.abs(after.weightKg - before.weightKg), unit)}
          </span>{" "}
          {after.weightKg <= before.weightKg ? "lost" : "gained"} between these photos
        </p>
      )}
    </div>
  );
}

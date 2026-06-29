import { useState } from "react";
import { toast } from "sonner";
import { Check, Palette, Target, User, Ruler } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { setGoal } from "../lib/data";
import { fromDisplay, toDisplay, unitLabel } from "../lib/units";
import { ACCENT_PRESETS } from "../lib/color";

const THEMES = [
  { id: "light", name: "Clean Light", swatch: "#2D6A4F", bg: "#F9F9F7" },
  { id: "dark", name: "Calm Dark", swatch: "#B2A478", bg: "#0F1115" },
  { id: "energetic", name: "Energetic", swatch: "#D4FF00", bg: "#0B0B0F" },
];

function Section({ icon: Icon, title, desc, children }) {
  return (
    <div className="rounded-[var(--radius)] border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-lg font-bold">{title}</h2>
      </div>
      {desc && <p className="-mt-2 mb-4 text-sm text-muted-foreground">{desc}</p>}
      {children}
    </div>
  );
}

export default function SettingsView() {
  const { uid, profile, stats, unit, theme, accent, goal, setUnit, setTheme, setAccent, updateProfile } =
    useApp();

  const [name, setName] = useState(profile?.displayName || "");
  const [height, setHeight] = useState(profile?.heightCm || "");
  const [customColor, setCustomColor] = useState(accent || "#2D6A4F");

  const [target, setTarget] = useState(
    goal?.targetWeightKg != null ? toDisplay(goal.targetWeightKg, unit).toFixed(1) : "",
  );
  const [start, setStart] = useState(
    goal?.startWeightKg != null
      ? toDisplay(goal.startWeightKg, unit).toFixed(1)
      : stats.current != null
        ? toDisplay(stats.current, unit).toFixed(1)
        : "",
  );
  const [targetDate, setTargetDate] = useState(goal?.targetDate?.slice?.(0, 10) || "");

  const saveProfile = () => {
    updateProfile({
      displayName: name,
      heightCm: height ? Number(height) : null,
    });
    toast.success("Profile saved");
  };

  const saveGoal = async () => {
    const targetKg = fromDisplay(target, unit);
    const startKg = fromDisplay(start, unit);
    if (targetKg == null || startKg == null) {
      toast.error("Enter valid start and target weights");
      return;
    }
    try {
      await setGoal(uid, {
        targetWeightKg: targetKg,
        startWeightKg: startKg,
        targetDate: targetDate ? new Date(targetDate).toISOString() : null,
      });
      toast.success("Goal updated 🎯");
    } catch {
      toast.error("Could not save goal");
    }
  };

  const applyCustom = () => {
    setAccent(customColor);
    toast.success("Custom accent applied 🎨");
  };

  return (
    <div className="space-y-6" data-testid="settings-view">
      <div>
        <h1 className="font-heading text-3xl font-black tracking-tighter">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Make WL Pro feel like yours.
        </p>
      </div>

      {/* Units */}
      <Section icon={Ruler} title="Units" desc="Switch between metric and imperial anytime.">
        <div className="inline-flex rounded-full border border-border p-1" data-testid="unit-toggle">
          {["kg", "lbs"].map((u) => (
            <button
              key={u}
              data-testid={`unit-${u}`}
              onClick={() => setUnit(u)}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition-colors ${
                unit === u
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {unitLabel(u)}
            </button>
          ))}
        </div>
      </Section>

      {/* Theme */}
      <Section icon={Palette} title="Appearance" desc="Pick a theme, then make it yours with a custom accent.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              data-testid={`theme-${t.id}`}
              onClick={() => setTheme(t.id)}
              className={`relative flex items-center gap-3 rounded-[var(--radius)] border-2 p-4 text-left transition-colors ${
                theme === t.id ? "border-primary" : "border-border hover:border-primary/40"
              }`}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border"
                style={{ background: t.bg }}
              >
                <span className="h-4 w-4 rounded-full" style={{ background: t.swatch }} />
              </span>
              <span className="text-sm font-semibold">{t.name}</span>
              {theme === t.id && (
                <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <p className="mb-3 text-sm font-medium">Accent color</p>
          <div className="flex flex-wrap items-center gap-2" data-testid="accent-presets">
            <button
              data-testid="accent-default"
              onClick={() => setAccent("")}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                !accent ? "border-primary text-primary" : "border-border text-muted-foreground"
              }`}
            >
              Theme default
            </button>
            {ACCENT_PRESETS.map((c) => (
              <button
                key={c}
                data-testid={`accent-${c}`}
                onClick={() => setAccent(c)}
                className="relative h-8 w-8 rounded-full border border-border"
                style={{ background: c }}
              >
                {accent?.toLowerCase() === c.toLowerCase() && (
                  <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                )}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <input
              type="color"
              value={customColor}
              data-testid="custom-color-input"
              onChange={(e) => setCustomColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-md border border-border bg-transparent"
            />
            <button
              onClick={applyCustom}
              data-testid="apply-custom-accent"
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Use custom color
            </button>
          </div>
        </div>
      </Section>

      {/* Goal */}
      <Section icon={Target} title="Your goal" desc="Where are you headed?">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Start weight ({unitLabel(unit)})</span>
            <input
              type="number"
              step="0.1"
              data-testid="goal-start"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 outline-none focus:border-primary"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Target weight ({unitLabel(unit)})</span>
            <input
              type="number"
              step="0.1"
              data-testid="goal-target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 outline-none focus:border-primary"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Target date (optional)</span>
            <input
              type="date"
              data-testid="goal-date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 outline-none focus:border-primary"
            />
          </label>
        </div>
        <button
          onClick={saveGoal}
          data-testid="save-goal-btn"
          className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Save goal
        </button>
      </Section>

      {/* Profile */}
      <Section icon={User} title="Profile">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Display name</span>
            <input
              data-testid="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 outline-none focus:border-primary"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Height (cm)</span>
            <input
              type="number"
              data-testid="profile-height"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 outline-none focus:border-primary"
            />
          </label>
        </div>
        <button
          onClick={saveProfile}
          data-testid="save-profile-btn"
          className="mt-4 rounded-full border border-border px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
        >
          Save profile
        </button>
      </Section>
    </div>
  );
}

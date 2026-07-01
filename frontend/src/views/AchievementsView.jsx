import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { evaluateBadges } from "../lib/badges";

export default function AchievementsView() {
  const { stats } = useApp();
  const badges = evaluateBadges(stats);
  const unlocked = badges.filter((b) => b.unlocked).length;

  const unlockHint = (badge) => {
    // Map each badge id to an actionable hint
    const hints = {
      "first-step": "Log your first weigh-in to unlock this.",
      "streak-3": `Keep logging daily — you need a 3-day streak (current: ${stats.streak}).`,
      "streak-7": `You need a 7-day logging streak (current: ${stats.streak}).`,
      "streak-30": `You need a 30-day logging streak (current: ${stats.streak}).`,
      "entries-10": `Log 10 weigh-ins total (current: ${stats.totalEntries}).`,
      "lost-1": "Lose 1 kg from your starting weight.",
      "lost-5": "Lose 5 kg from your starting weight.",
      "halfway": "Reach 50% progress toward your goal weight.",
      "goal": "Hit your target weight to unlock this.",
      "hydration": "Log 8 glasses of water in a single day.",
      "steps": "Log 10,000 steps in a single day.",
      "photo": "Upload your first progress photo.",
    };
    return hints[badge.id] || badge.desc;
  };

  return (
    <div className="space-y-6" data-testid="achievements-view">
      <div>
        <h1 className="font-heading text-3xl font-black tracking-tighter">Achievements</h1>
        <p className="text-sm text-muted-foreground">
          {unlocked} of {badges.length} unlocked
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${(unlocked / badges.length) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {badges.map((b) => {
          const Icon = b.icon;
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative flex flex-col items-center rounded-[var(--radius)] border p-5 text-center transition-all ${
                b.unlocked
                  ? "border-primary/40 bg-primary/10"
                  : "border-border bg-card opacity-60"
              }`}
              data-testid={`badge-${b.id}`}
              title={b.unlocked ? b.desc : unlockHint(b)}
            >
              <div
                className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                  b.unlocked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {b.unlocked ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
              </div>
              <p className="text-sm font-bold leading-tight">{b.name}</p>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">
                {b.unlocked ? b.desc : unlockHint(b)}
              </p>
              {b.unlocked && (
                <span className="absolute right-2 top-2 text-xs">✓</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

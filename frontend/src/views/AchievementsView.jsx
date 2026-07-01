import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { evaluateBadges } from "../lib/badges";

export default function AchievementsView() {
  const { stats } = useApp();
  const badges = evaluateBadges(stats);
  const unlocked = badges.filter((b) => b.unlocked).length;

  return (
    <div className="space-y-6" data-testid="achievements-view">
      <div>
        <h1 className="font-heading text-3xl font-black tracking-tighter">
          Achievements
        </h1>
        <p className="text-sm text-muted-foreground">
          You've unlocked{" "}
          <span className="font-semibold text-primary" data-testid="badges-count">
            {unlocked}
          </span>{" "}
          of {badges.length} milestones. Keep going!
        </p>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary transition-all duration-700"
          style={{ width: `${(unlocked / badges.length) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {badges.map((b, i) => {
          const Icon = b.icon;
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className={`relative flex flex-col items-center rounded-[var(--radius)] border p-6 text-center transition-colors ${
                b.unlocked
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card opacity-70"
              }`}
              data-testid={`badge-${b.id}`}
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  b.unlocked
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {b.unlocked ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
              </div>
              <p className="font-heading mt-3 text-sm font-bold">{b.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{b.desc}</p>
              {b.unlocked && (
                <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Unlocked
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

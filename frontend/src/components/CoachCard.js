import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "../contexts/AppContext";
import { getCoachMessage } from "../lib/coach";

export default function CoachCard() {
  const { stats, unit, goal } = useApp();
  const { headline, message } = getCoachMessage(stats, unit, goal);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-[var(--radius)] border border-primary/30 bg-gradient-to-br from-primary/15 to-transparent p-6"
      data-testid="coach-card"
    >
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
      <div className="relative flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Your Coach
          </p>
          <h3 className="font-heading mt-1 text-lg font-bold" data-testid="coach-headline">
            {headline}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="coach-message">
            {message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

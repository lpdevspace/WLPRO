import { useEffect } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../contexts/AppContext";

function burst() {
  const opts = { spread: 80, startVelocity: 45, ticks: 200, zIndex: 9999 };
  confetti({ ...opts, particleCount: 90, origin: { x: 0.2, y: 0.4 } });
  confetti({ ...opts, particleCount: 90, origin: { x: 0.8, y: 0.4 } });
  setTimeout(
    () => confetti({ ...opts, particleCount: 120, origin: { y: 0.35 } }),
    250,
  );
}

export default function CelebrationOverlay() {
  const { newMilestone, clearMilestone } = useApp();

  useEffect(() => {
    if (newMilestone) burst();
  }, [newMilestone]);

  return (
    <AnimatePresence>
      {newMilestone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={clearMilestone}
          data-testid="celebration-overlay"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-full max-w-xs rounded-[var(--radius)] border border-primary/40 bg-card p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <newMilestone.icon className="h-9 w-9" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-primary">
              Milestone unlocked
            </p>
            <h3 className="font-heading mt-1 text-2xl font-black">{newMilestone.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{newMilestone.desc}</p>
            <button
              onClick={clearMilestone}
              data-testid="celebration-continue"
              className="mt-6 w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Keep going 💪
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

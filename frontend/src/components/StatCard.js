import { motion } from "framer-motion";

export default function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
  testId,
  className = "",
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`group rounded-[var(--radius)] border bg-card p-6 transition-[transform,border-color] duration-200 hover:-translate-y-1 hover:border-primary/50 ${className}`}
      data-testid={testId}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full ${
              accent ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="metric-font mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {value}
      </div>
      {sub && <div className="mt-1 text-sm text-muted-foreground">{sub}</div>}
    </motion.div>
  );
}

import {
  Footprints,
  Droplets,
  Flame,
  Trophy,
  Target,
  Camera,
  TrendingDown,
  Award,
  Star,
  Sparkles,
  Medal,
  Calendar,
} from "lucide-react";

// Each badge: { id, name, desc, icon, earned(stats) -> bool }
export const BADGES = [
  {
    id: "first-step",
    name: "First Step",
    desc: "Log your very first weigh-in",
    icon: Star,
    earned: (s) => s.totalEntries >= 1,
  },
  {
    id: "streak-3",
    name: "Getting Going",
    desc: "Keep a 3-day logging streak",
    icon: Flame,
    earned: (s) => s.streak >= 3,
  },
  {
    id: "streak-7",
    name: "Week Warrior",
    desc: "Keep a 7-day logging streak",
    icon: Calendar,
    earned: (s) => s.streak >= 7,
  },
  {
    id: "streak-30",
    name: "Unstoppable",
    desc: "Keep a 30-day logging streak",
    icon: Medal,
    earned: (s) => s.streak >= 30,
  },
  {
    id: "entries-10",
    name: "Consistent",
    desc: "Record 10 weigh-ins",
    icon: Award,
    earned: (s) => s.totalEntries >= 10,
  },
  {
    id: "lost-1",
    name: "First Kilo",
    desc: "Lose your first 1 kg from start",
    icon: TrendingDown,
    earned: (s) => s.totalChange != null && s.totalChange <= -1,
  },
  {
    id: "lost-5",
    name: "Five Down",
    desc: "Lose 5 kg from start",
    icon: TrendingDown,
    earned: (s) => s.totalChange != null && s.totalChange <= -5,
  },
  {
    id: "halfway",
    name: "Halfway Hero",
    desc: "Reach 50% of your goal",
    icon: Target,
    earned: (s) => s.goalProgress != null && s.goalProgress >= 0.5,
  },
  {
    id: "goal",
    name: "Goal Crusher",
    desc: "Reach your target weight",
    icon: Trophy,
    earned: (s) => s.goalProgress != null && s.goalProgress >= 1,
  },
  {
    id: "hydration",
    name: "Hydration Hero",
    desc: "Drink 8 glasses of water in a day",
    icon: Droplets,
    earned: (s) => (s.today?.water || 0) >= 8,
  },
  {
    id: "steps",
    name: "Step Master",
    desc: "Walk 10,000 steps in a day",
    icon: Footprints,
    earned: (s) => (s.today?.steps || 0) >= 10000,
  },
  {
    id: "photo",
    name: "Picture Perfect",
    desc: "Add your first progress photo",
    icon: Camera,
    earned: (s) => s.totalPhotos >= 1,
  },
];

export function evaluateBadges(stats) {
  return BADGES.map((b) => ({ ...b, unlocked: b.earned(stats) }));
}

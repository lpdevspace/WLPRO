import { formatWeight } from "./units";

// Rule-based motivational coach. Returns { headline, message } chosen from
// data-driven candidates with a little daily rotation for variety.
export function getCoachMessage(stats, unit, goal) {
  const candidates = [];
  const {
    current,
    lastChange,
    totalChange,
    streak,
    loggedToday,
    goalProgress,
    toGoalKg,
    today,
    totalEntries,
  } = stats;

  if (totalEntries === 0) {
    return {
      headline: "Let's begin",
      message:
        "Log your first weigh-in to unlock your trend, streaks and milestones. Small steps, big change.",
    };
  }

  if (!loggedToday) {
    candidates.push({
      headline: "Time to check in",
      message:
        "You haven't logged today yet. A quick weigh-in keeps your streak alive and your trend honest.",
    });
  } else {
    candidates.push({
      headline: "Logged & locked in",
      message: `Nice — today's entry is in. Consistency is the real superpower here.`,
    });
  }

  if (streak >= 3) {
    candidates.push({
      headline: `${streak}-day streak 🔥`,
      message: `You've checked in ${streak} days straight. Momentum like this is exactly how lasting habits are built.`,
    });
  }

  if (lastChange != null) {
    if (lastChange < -0.05) {
      candidates.push({
        headline: "Trending down",
        message: `You're down ${formatWeight(Math.abs(lastChange), unit)} since your last entry. Keep doing what's working.`,
      });
    } else if (lastChange > 0.05) {
      candidates.push({
        headline: "A small bump",
        message:
          "Weight naturally fluctuates day to day — water, sleep and food all play a part. Zoom out and trust the trend.",
      });
    } else {
      candidates.push({
        headline: "Holding steady",
        message:
          "Maintenance is an achievement too. Stay the course and let the habits compound.",
      });
    }
  }

  if (goal && goalProgress != null) {
    const pct = Math.round(goalProgress * 100);
    if (goalProgress >= 1) {
      candidates.push({
        headline: "Goal reached! 🎉",
        message:
          "You hit your target weight. Time to celebrate — and maybe set your next chapter.",
      });
    } else if (pct >= 50) {
      candidates.push({
        headline: `${pct}% to your goal`,
        message: `Over halfway there! Just ${formatWeight(Math.abs(toGoalKg), unit)} to go. The finish line is in sight.`,
      });
    } else {
      candidates.push({
        headline: `${pct}% to your goal`,
        message: `${formatWeight(Math.abs(toGoalKg), unit)} to your target. Every entry is a vote for the person you're becoming.`,
      });
    }
  }

  if (today && (today.water || 0) < 6) {
    candidates.push({
      headline: "Stay hydrated",
      message:
        "You're a few glasses short today. Water supports metabolism, energy and appetite control.",
    });
  }

  if (today && (today.steps || 0) >= 8000) {
    candidates.push({
      headline: "On your feet",
      message: `${today.steps.toLocaleString()} steps today — movement is medicine. Brilliant work.`,
    });
  }

  if (totalChange != null && totalChange < -0.5) {
    candidates.push({
      headline: "Look how far you've come",
      message: `Since you started you're down ${formatWeight(Math.abs(totalChange), unit)}. That's real, hard-earned progress.`,
    });
  }

  // Daily rotation so the card feels fresh.
  const idx = new Date().getDate() % candidates.length;
  return candidates[idx] || candidates[0];
}

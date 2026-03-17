/**
 * Computes the current streak given an array of unique completion dates
 * in descending order (most recent first), formatted as "YYYY-MM-DD".
 *
 * Streak rules:
 * - Streak is 0 if no sessions exist
 * - Streak is 0 if the most recent session is older than yesterday
 * - Otherwise, count consecutive days from the most recent backward
 */
export function computeStreak(dates: string[]): number {
  if (!dates.length) return 0;

  const today = new Date();
  const todayStr = toLocalDate(today);
  const yesterdayStr = toLocalDate(new Date(today.getTime() - 86400000));

  // Streak must include today or yesterday (not already broken)
  if (dates[0] !== todayStr && dates[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + "T00:00:00");
    const curr = new Date(dates[i] + "T00:00:00");
    const diffDays = Math.round(
      (prev.getTime() - curr.getTime()) / 86400000
    );
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function toLocalDate(d: Date): string {
  return d.toLocaleDateString("en-CA"); // returns YYYY-MM-DD
}

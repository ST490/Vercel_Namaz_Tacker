import { format, subDays, differenceInCalendarDays } from 'date-fns';

export const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const PRAYER_LABELS = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha'
};

export const PRAYER_ICONS = {
  fajr: '🌅',
  dhuhr: '☀️',
  asr: '🌤️',
  maghrib: '🌇',
  isha: '🌙'
};

export const LOCATION_LABELS = {
  mosque: 'Mosque (Jamaat)',
  home: 'Home (Alone)',
  other: 'Other'
};

export const TIMELINESS_LABELS = {
  on_time: 'On Time',
  late: 'Late',
  qaza: 'Qaza (Missed)'
};

export const COMPOSITION_LABELS = {
  fard_only: 'Fard Only',
  fard_sunnah: 'Fard + Sunnah',
  fard_sunnah_nafl: 'Fard + Sunnah + Nafl'
};

export function getTodayStr() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function computeDayScore(dayLogs) {
  if (!dayLogs || dayLogs.length === 0) return 0;
  let score = 0;
  const completedPrayers = dayLogs.filter(l => l.completed);
  score += completedPrayers.length * 2;
  completedPrayers.forEach(l => {
    if (l.location === 'mosque') score += 1;
    if (l.timeliness === 'on_time') score += 1;
    if (l.composition === 'fard_sunnah') score += 0.5;
    if (l.composition === 'fard_sunnah_nafl') score += 1;
  });
  if (dayLogs.some(l => l.quran_read)) score += 2;
  return Math.min(score / 17, 1);
}

export function getHeatmapColor(score, isDark) {
  if (score === 0) return isDark ? 'hsl(0, 0%, 12%)' : 'hsl(45, 15%, 90%)';
  if (isDark) {
    const lightness = 20 + score * 40;
    const saturation = 40 + score * 40;
    return `hsl(43, ${saturation}%, ${lightness}%)`;
  }
  const lightness = 85 - score * 55;
  const saturation = 20 + score * 30;
  return `hsl(153, ${saturation}%, ${lightness}%)`;
}

export function computeStreak(logsByDate) {
  let streak = 0;
  let date = new Date();
  const todayStr = format(date, 'yyyy-MM-dd');
  const todayLogs = logsByDate[todayStr];
  if (!todayLogs || todayLogs.filter(l => l.completed).length === 0) {
    date = subDays(date, 1);
  }

  while (true) {
    const dateStr = format(date, 'yyyy-MM-dd');
    const logs = logsByDate[dateStr];
    if (!logs || logs.filter(l => l.completed).length === 0) break;
    streak++;
    date = subDays(date, 1);
  }
  return streak;
}

export function computeLongestStreak(logsByDate) {
  const dates = Object.keys(logsByDate).sort();
  if (dates.length === 0) return 0;
  let longest = 0;
  let current = 0;
  let prevDate = null;

  for (const dateStr of dates) {
    const logs = logsByDate[dateStr];
    if (logs && logs.filter(l => l.completed).length > 0) {
      if (prevDate && differenceInCalendarDays(new Date(dateStr), new Date(prevDate)) === 1) {
        current++;
      } else {
        current = 1;
      }
      longest = Math.max(longest, current);
      prevDate = dateStr;
    } else {
      current = 0;
      prevDate = null;
    }
  }
  return longest;
}

export const ACHIEVEMENTS = [
  { key: 'first_prayer', title: 'First Step', description: 'Log your first prayer', icon: '🌟', target: 1 },
  { key: 'week_streak', title: 'Consistent Believer', description: '7-day prayer streak', icon: '🔥', target: 7 },
  { key: 'month_streak', title: 'Steadfast', description: '30-day prayer streak', icon: '💎', target: 30 },
  { key: 'mosque_regular', title: 'Mosque Regular', description: 'Pray at the mosque 7 days in a row', icon: '🕌', target: 7 },
  { key: 'early_bird', title: 'Early Bird', description: 'Fajr on time 30 days straight', icon: '🌅', target: 30 },
  { key: 'sunnah_guardian', title: 'Sunnah Guardian', description: 'Pray Fard + Sunnah 14 days in a row', icon: '📿', target: 14 },
  { key: 'quran_lover', title: 'Quran Lover', description: 'Read Quran 7 days in a row', icon: '📖', target: 7 },
  { key: 'perfect_day', title: 'Perfect Day', description: 'All 5 prayers on time at the mosque + Quran', icon: '✨', target: 1 },
  { key: 'qaza_warrior', title: 'Qaza Warrior', description: 'Make up 50 missed prayers', icon: '⚔️', target: 50 },
  { key: 'centurion', title: 'Centurion', description: '100-day prayer streak', icon: '👑', target: 100 },
];
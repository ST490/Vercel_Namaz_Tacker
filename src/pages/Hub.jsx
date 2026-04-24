import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ACHIEVEMENTS, computeStreak, computeLongestStreak } from '@/lib/prayerUtils';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { format } from 'date-fns';
import { Lock, Clock, CalendarDays, Loader2 } from 'lucide-react';
import TasbeehCounter from '@/components/tracker/TasbeehCounter';

const PRAYER_ORDER = [
  { key: 'fajr',    label: 'Fajr',    icon: '🌅' },
  { key: 'dhuhr',   label: 'Dhuhr',   icon: '☀️' },
  { key: 'asr',     label: 'Asr',     icon: '🌤️' },
  { key: 'maghrib', label: 'Maghrib', icon: '🌇' },
  { key: 'isha',    label: 'Isha',    icon: '🌙' },
];

// ── Utility Widget: Date Card ──────────────────────────────────────────────
function DateWidget({ hijri, gregorian }) {
  const today = new Date();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl p-4 border border-border bg-card flex flex-col gap-1"
    >
      <div className="flex items-center gap-2 mb-1">
        <CalendarDays className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Date</span>
      </div>
      <p className="text-sm font-bold text-foreground">{format(today, 'MMMM d, yyyy')}</p>
      <p className="text-xs text-muted-foreground">{format(today, 'EEEE')}</p>
      <div className="mt-2 pt-2 border-t border-border/50">
        {hijri ? (
          <>
            <p className="text-sm font-bold text-primary" dir="rtl">
              {hijri.day} {hijri.monthAr}
            </p>
            <p className="text-xs text-muted-foreground">{hijri.formatted}</p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground italic">Loading Hijri date…</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Utility Widget: Timings Card ──────────────────────────────────────────
function TimingsWidget({ timings, isLoading }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.05 }}
      className="rounded-2xl p-4 border border-border bg-card flex flex-col gap-1"
    >
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Today's Timings</span>
      </div>
      {isLoading ? (
        <div className="space-y-1.5 mt-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-5 rounded bg-secondary animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-1 mt-1">
          {PRAYER_ORDER.map(p => (
            <div key={p.key} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <span>{p.icon}</span> {p.label}
              </span>
              <span className="text-xs font-semibold text-foreground tabular-nums">
                {timings?.[p.key] || '--:--'}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Main Hub Page ─────────────────────────────────────────────────────────
export default function Hub() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: prayerData, isLoading: timingsLoading } = usePrayerTimes(today);

  const { data: allLogs = [] } = useQuery({
    queryKey: ['prayer-logs'],
    queryFn: () => base44.entities.PrayerLog.list('-date', 1000),
  });

  const { data: qazaList = [] } = useQuery({
    queryKey: ['qaza'],
    queryFn: () => base44.entities.QazaTracker.list(),
  });

  const logsByDate = useMemo(() => {
    const map = {};
    allLogs.forEach(log => {
      if (!map[log.date]) map[log.date] = [];
      map[log.date].push(log);
    });
    return map;
  }, [allLogs]);

  const achievementProgress = useMemo(() => {
    const streak = computeStreak(logsByDate);
    const longestStreak = computeLongestStreak(logsByDate);
    const totalPrayers = allLogs.filter(l => l.completed).length;
    const totalQazaCompleted = qazaList.reduce((sum, q) => sum + (q.completed_count || 0), 0);

    const mosqueDays = Object.values(logsByDate).filter(
      dayLogs => dayLogs.some(l => l.completed && l.location === 'mosque')
    ).length;

    const fajrOnTimeDays = Object.values(logsByDate).filter(
      dayLogs => dayLogs.some(l => l.prayer_name === 'fajr' && l.completed && l.timeliness === 'on_time')
    ).length;

    const sunnahDays = Object.values(logsByDate).filter(
      dayLogs => dayLogs.some(l => l.completed && (l.composition === 'fard_sunnah' || l.composition === 'fard_sunnah_nafl'))
    ).length;

    const quranDays = Object.values(logsByDate).filter(
      dayLogs => dayLogs.some(l => l.quran_read)
    ).length;

    const perfectDays = Object.values(logsByDate).filter(dayLogs => {
      const completed = dayLogs.filter(l => l.completed);
      return completed.length === 5 &&
        completed.every(l => l.timeliness === 'on_time' && l.location === 'mosque') &&
        dayLogs.some(l => l.quran_read);
    }).length;

    return {
      first_prayer: { progress: Math.min(totalPrayers, 1), unlocked: totalPrayers >= 1 },
      week_streak: { progress: Math.min(longestStreak, 7), unlocked: longestStreak >= 7 },
      month_streak: { progress: Math.min(longestStreak, 30), unlocked: longestStreak >= 30 },
      mosque_regular: { progress: Math.min(mosqueDays, 7), unlocked: mosqueDays >= 7 },
      early_bird: { progress: Math.min(fajrOnTimeDays, 30), unlocked: fajrOnTimeDays >= 30 },
      sunnah_guardian: { progress: Math.min(sunnahDays, 14), unlocked: sunnahDays >= 14 },
      quran_lover: { progress: Math.min(quranDays, 7), unlocked: quranDays >= 7 },
      perfect_day: { progress: Math.min(perfectDays, 1), unlocked: perfectDays >= 1 },
      qaza_warrior: { progress: Math.min(totalQazaCompleted, 50), unlocked: totalQazaCompleted >= 50 },
      centurion: { progress: Math.min(longestStreak, 100), unlocked: longestStreak >= 100 },
    };
  }, [logsByDate, allLogs, qazaList]);

  const unlockedCount = Object.values(achievementProgress).filter(a => a.unlocked).length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="text-center">
        <h2 className="font-heading text-2xl font-bold text-foreground">Hub</h2>
        <p className="text-xs text-muted-foreground mt-1">Utilities &amp; Achievements</p>
      </div>

      {/* ── Utilities Section ── */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Utilities
        </h3>

        {/* 2-col grid for Date + Timings */}
        <div className="grid grid-cols-2 gap-3">
          <DateWidget hijri={prayerData?.hijri} gregorian={prayerData?.gregorian} />
          <TimingsWidget timings={prayerData?.timings} isLoading={timingsLoading} />
        </div>

        {/* Full-width Tasbeeh Counter */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📿</span>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Tasbeeh Counter</h4>
                <p className="text-[10px] text-muted-foreground">Digital dhikr counter</p>
              </div>
            </div>
          </div>
          <TasbeehCounter />
        </div>
      </section>

      {/* ── Achievements Section ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Achievements
          </h3>
          <span className="text-[10px] text-muted-foreground">
            {unlockedCount}/{ACHIEVEMENTS.length} unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((achievement, i) => {
            const data = achievementProgress[achievement.key] || { progress: 0, unlocked: false };
            const progress = (data.progress / achievement.target) * 100;

            return (
              <motion.div
                key={achievement.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-xl border p-4 text-center relative overflow-hidden ${
                  data.unlocked
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                {!data.unlocked && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-3 h-3 text-muted-foreground/40" />
                  </div>
                )}
                <div className={`text-3xl mb-2 ${data.unlocked ? '' : 'grayscale opacity-40'}`}>
                  {achievement.icon}
                </div>
                <h4 className={`text-xs font-bold mb-0.5 ${data.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {achievement.title}
                </h4>
                <p className="text-[9px] text-muted-foreground leading-tight mb-2">
                  {achievement.description}
                </p>
                {!data.unlocked && (
                  <div className="space-y-1">
                    <div className="h-1 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, delay: i * 0.04 }}
                      />
                    </div>
                    <p className="text-[8px] text-muted-foreground">
                      {data.progress}/{achievement.target}
                    </p>
                  </div>
                )}
                {data.unlocked && (
                  <div className="text-[9px] font-semibold text-primary">Unlocked ✓</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

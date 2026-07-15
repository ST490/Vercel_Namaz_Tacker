import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ACHIEVEMENTS, computeStreak, computeLongestStreak } from '@/lib/prayerUtils';
import { usePrayerTimes, getCurrentPrayer } from '@/hooks/usePrayerTimes';
import { format, parse } from 'date-fns';
import { Lock, Clock, CalendarDays, Compass, X, BookOpen } from 'lucide-react';
import TasbeehCounter from '@/components/tracker/TasbeehCounter';

const PRAYER_ORDER = [
  { key: 'fajr',    label: 'Fajr',    icon: '🌅' },
  { key: 'dhuhr',   label: 'Dhuhr',   icon: '☀️' },
  { key: 'asr',     label: 'Asr',     icon: '🌤️' },
  { key: 'maghrib', label: 'Maghrib', icon: '🌇' },
  { key: 'isha',    label: 'Isha',    icon: '🌙' },
];

import FullCalendarWidget from '@/components/tracker/FullCalendarWidget';

import PrayerIcon from '@/components/tracker/PrayerIcon';

// ── Utility Widget: Timings Card (Fullscreen) ─────────────────────────────
function TimingsWidget({ timings, isLoading }) {
  return (
    <div className="rounded-3xl p-6 border border-border bg-card flex flex-col gap-2 shadow-lg w-full">
      <div className="flex flex-col items-center text-center gap-2 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
          <Clock className="w-6 h-6" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Prayer Timings</span>
      </div>

      {isLoading ? (
        <div className="space-y-3 mt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-secondary animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3 mt-2">
          {PRAYER_ORDER.map(p => (
            <div key={p.key} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
              <div className="flex items-center gap-3">
                <PrayerIcon prayer={p.key} size="sm" />
                <span className="text-sm font-cutoff font-bold text-foreground">
                  {p.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm font-cutoff font-bold text-foreground tabular-nums">
                  {timings?.[p.key] ? format(parse(timings[p.key].split(' ')[0], 'HH:mm', new Date()), 'h:mm a') : '--:--'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import QiblaPointer from '@/components/tracker/QiblaPointer';
import QuranWidget from '@/components/tracker/QuranWidget';

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

  const [activeFullscreen, setActiveFullscreen] = useState(null);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="text-center">
        <h2 className="font-heading text-2xl font-bold text-primary">Hub</h2>
        <p className="text-xs text-muted-foreground mt-1">Utilities &amp; Achievements</p>
      </div>

      {/* ── Utilities Section ── */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Utilities
        </h3>

        {/* Utilities Grid - 2x2 Layout (Slightly rectangular) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Date Preview Card */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFullscreen('date')}
            className="aspect-[5/4] rounded-2xl p-4 border border-indigo-500/20 bg-indigo-500/10 cursor-pointer shadow-sm hover:bg-indigo-500/20 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <CalendarDays className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">Date</span>
              </div>
              <span className="text-2xl font-black text-foreground leading-tight block truncate">{format(new Date(), 'MMM d, yy')}</span>
              <span className="text-sm text-muted-foreground">{format(new Date(), 'EEEE')}</span>
            </div>

            <div className="pt-2 border-t border-indigo-500/20">
              <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 truncate" dir="rtl">
                {prayerData?.hijri ? `${prayerData.hijri.day} ${prayerData.hijri.monthAr}` : ''}
              </div>
              <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                {prayerData?.hijri ? prayerData.hijri.formatted : 'Loading...'}
              </div>
            </div>
          </motion.div>

          {/* Timings Preview Card */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFullscreen('timings')}
            className="aspect-[5/4] rounded-2xl p-4 border border-amber-500/20 bg-amber-500/10 flex flex-col items-center justify-center gap-2 cursor-pointer shadow-sm hover:bg-amber-500/20 transition-colors"
          >
            <div className="flex items-center justify-center text-amber-500 dark:text-amber-400 mb-1">
              {timingsLoading || !prayerData ? (
                <Clock className="w-10 h-10" />
              ) : (
                <PrayerIcon prayer={getCurrentPrayer(prayerData.timings)?.key} size="lg" />
              )}
            </div>
            <div className="text-center">
              <h4 className="text-lg font-black text-foreground">
                {timingsLoading || !prayerData ? 'Timings' : getCurrentPrayer(prayerData.timings)?.label}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {timingsLoading || !prayerData ? 'Loading...' : format(parse(prayerData.timings[getCurrentPrayer(prayerData.timings).key].split(' ')[0], 'HH:mm', new Date()), 'h:mm a')}
              </p>
            </div>
          </motion.div>

          {/* Qibla Preview Card */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFullscreen('qibla')}
            className="aspect-[5/4] rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/10 flex flex-col items-center justify-center gap-2 cursor-pointer shadow-sm hover:bg-emerald-500/20 transition-colors"
          >
            <div className="flex items-center justify-center text-emerald-500 dark:text-emerald-400 mb-1">
              <Compass className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h4 className="text-lg font-black text-foreground">Qibla</h4>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-300/70 mt-0.5">Find Direction</p>
            </div>
          </motion.div>

          {/* Tasbeeh Preview Card */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFullscreen('tasbeeh')}
            className="aspect-[5/4] rounded-2xl p-4 border border-purple-500/20 bg-purple-500/10 flex flex-col items-center justify-center gap-2 cursor-pointer shadow-sm hover:bg-purple-500/20 transition-colors"
          >
            <div className="flex items-center justify-center mb-1">
              <span className="text-4xl drop-shadow-sm">📿</span>
            </div>
            <div className="text-center">
              <h4 className="text-lg font-black text-foreground">Tasbeeh</h4>
              <p className="text-[11px] text-purple-600 dark:text-purple-300/70 mt-0.5">Dhikr Counter</p>
            </div>
          </motion.div>

          {/* Quran Preview Card */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFullscreen('quran')}
            className="col-span-2 aspect-[5/2] rounded-2xl p-5 border border-rose-500/20 bg-rose-500/10 flex items-center justify-between cursor-pointer shadow-sm hover:bg-rose-500/20 transition-colors overflow-hidden relative"
          >
            <div className="flex flex-col justify-center relative z-10">
              <h4 className="text-xl font-black text-foreground mb-1">Holy Quran</h4>
              <p className="text-xs text-rose-600 dark:text-rose-300/80 font-medium">Continue Reading</p>
            </div>
            <div className="relative z-10 w-14 h-14 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <BookOpen size={26} strokeWidth={2.5} />
            </div>
            <div className="absolute right-[-5%] bottom-[-30%] text-rose-500/5 rotate-[-15deg] pointer-events-none">
               <BookOpen size={140} fill="currentColor" stroke="none" />
            </div>
          </motion.div>
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

      {/* ── Fullscreen Overlay ── */}
      <AnimatePresence>
        {activeFullscreen && activeFullscreen !== 'quran' && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col p-4 md:p-8 overflow-y-auto"
          >
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setActiveFullscreen(null)}
                className="w-10 h-10 rounded-full bg-secondary text-foreground flex items-center justify-center hover:bg-secondary/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full pb-12">
              {activeFullscreen === 'date' && (
                <div className="w-full">
                  <FullCalendarWidget />
                </div>
              )}
              {activeFullscreen === 'timings' && (
                <TimingsWidget timings={prayerData?.timings} isLoading={timingsLoading} />
              )}
              {activeFullscreen === 'qibla' && (
                <div className="w-full">
                  <QiblaPointer />
                </div>
              )}
              {activeFullscreen === 'tasbeeh' && (
                <div className="w-full rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
                   <div className="px-4 pt-4 pb-2 border-b border-border/50 text-center">
                     <h3 className="text-sm font-bold text-foreground">Tasbeeh Counter</h3>
                   </div>
                   <TasbeehCounter />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quran Fullscreen ── */}
      {activeFullscreen === 'quran' && (
        <QuranWidget onClose={() => setActiveFullscreen(null)} />
      )}
    </div>
  );
}

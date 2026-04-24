import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isToday, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, CalendarDays } from 'lucide-react';
import { PRAYERS, getTodayStr, computeStreak, computeLongestStreak } from '@/lib/prayerUtils';
import PrayerCard from '@/components/tracker/PrayerCard';
import QuranCard from '@/components/tracker/QuranCard';
import StreakBanner from '@/components/tracker/StreakBanner';
import HeatmapCalendar from '@/components/tracker/HeatmapCalendar';
import CurrentPrayerWidget from '@/components/tracker/CurrentPrayerWidget';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(null); // null = today
  const [showCalendar, setShowCalendar] = useState(false);

  const today = getTodayStr();
  const viewDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : today;
  const isViewingToday = viewDate === today;

  const { data: allLogs = [], isLoading } = useQuery({
    queryKey: ['prayer-logs'],
    queryFn: () => base44.entities.PrayerLog.list('-date', 1000),
  });

  const logsByDate = useMemo(() => {
    const map = {};
    allLogs.forEach(log => {
      if (!map[log.date]) map[log.date] = [];
      map[log.date].push(log);
    });
    return map;
  }, [allLogs]);

  const viewLogs = useMemo(() => logsByDate[viewDate] || [], [logsByDate, viewDate]);

  const viewLogMap = useMemo(() => {
    const map = {};
    viewLogs.forEach(log => { map[log.prayer_name] = log; });
    return map;
  }, [viewLogs]);

  const quranLog = viewLogs.find(l => l.quran_read !== undefined && l.quran_read);
  const quranRead = !!quranLog;
  const quranPages = quranLog?.quran_pages || viewLogs[0]?.quran_pages || 0;

  const completedToday = viewLogs.filter(l => l.completed).length;
  const currentStreak = useMemo(() => computeStreak(logsByDate), [logsByDate]);
  const longestStreak = useMemo(() => computeLongestStreak(logsByDate), [logsByDate]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PrayerLog.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prayer-logs'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PrayerLog.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prayer-logs'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PrayerLog.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prayer-logs'] }),
  });

  const handleTogglePrayer = async (prayerName, completed) => {
    const existing = viewLogMap[prayerName];
    if (completed) {
      if (existing) {
        updateMutation.mutate({ id: existing.id, data: { completed: true, timeliness: 'on_time', location: 'home', composition: 'fard_only' } });
      } else {
        createMutation.mutate({ date: viewDate, prayer_name: prayerName, completed: true, timeliness: 'on_time', location: 'home', composition: 'fard_only' });
      }
    } else {
      if (existing) {
        deleteMutation.mutate(existing.id);
      }
    }
  };

  const handleUpdateDetail = async (prayerName, field, value) => {
    const existing = viewLogMap[prayerName];
    if (existing) {
      updateMutation.mutate({ id: existing.id, data: { [field]: value } });
    }
  };

  const handleQuranToggle = async () => {
    const firstLog = viewLogs[0];
    if (quranRead) {
      if (firstLog) {
        updateMutation.mutate({ id: firstLog.id, data: { quran_read: false, quran_pages: 0 } });
      }
    } else {
      if (firstLog) {
        updateMutation.mutate({ id: firstLog.id, data: { quran_read: true } });
      } else {
        createMutation.mutate({ date: viewDate, prayer_name: 'fajr', completed: false, quran_read: true, quran_pages: 0 });
      }
    }
  };

  const handleQuranPages = async (pages) => {
    const firstLog = viewLogs.find(l => l.quran_read) || viewLogs[0];
    if (firstLog) {
      updateMutation.mutate({ id: firstLog.id, data: { quran_pages: pages } });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const progressPercent = (completedToday / 5) * 100;

  return (
    <div className="space-y-4">

      {/* ── Date Header ── */}
      <div className="text-center relative">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {isViewingToday ? format(new Date(), 'EEEE') : format(selectedDate, 'EEEE')}
        </p>
        <button
          onClick={() => setShowCalendar(true)}
          className="inline-flex items-center gap-1.5 group"
        >
          <h2 className="font-heading text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
            {isViewingToday
              ? format(new Date(), 'MMMM d, yyyy')
              : format(selectedDate, 'MMMM d, yyyy')}
          </h2>
          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
        </button>

        {!isViewingToday && (
          <div className="mt-1">
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              ← Back to today
            </button>
          </div>
        )}
      </div>

      {/* ── Calendar Modal ── */}
      <AnimatePresence>
        {showCalendar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCalendar(false)}
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm"
            >
              <div className="rounded-2xl border border-border bg-card p-4 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm">View a Previous Day</h3>
                  </div>
                  <button
                    onClick={() => setShowCalendar(false)}
                    className="p-1 rounded-full hover:bg-secondary transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <DayPicker
                  mode="single"
                  selected={selectedDate || new Date()}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(isToday(date) ? null : date);
                      setShowCalendar(false);
                    }
                  }}
                  disabled={[{ after: new Date() }]}
                  className="!m-0"
                  classNames={{
                    months: 'flex flex-col',
                    month: 'space-y-2',
                    caption: 'flex justify-center items-center relative h-9',
                    caption_label: 'text-sm font-semibold',
                    nav: 'flex items-center gap-1',
                    nav_button: 'p-1 rounded-md hover:bg-secondary transition-colors',
                    table: 'w-full border-collapse',
                    head_row: 'flex',
                    head_cell: 'text-muted-foreground rounded-md w-9 font-medium text-[0.65rem] uppercase',
                    row: 'flex w-full mt-1',
                    cell: 'h-9 w-9 text-center text-sm relative',
                    day: 'h-9 w-9 p-0 font-normal rounded-full hover:bg-secondary transition-colors',
                    day_selected: 'bg-primary text-primary-foreground hover:bg-primary',
                    day_today: 'font-bold text-primary',
                    day_outside: 'opacity-30',
                    day_disabled: 'opacity-20 cursor-not-allowed',
                  }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Current Prayer Widget ── */}
      {isViewingToday && <CurrentPrayerWidget />}

      {/* ── Streak Banner ── */}
      <StreakBanner
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        completedToday={completedToday}
        totalPrayers={5}
      />

      {/* ── Daily Prayers ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {isViewingToday ? "Today's Prayers" : "Prayers"}
          </h3>
          <span className="text-[10px] text-muted-foreground">{completedToday}/5</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>

        {PRAYERS.map((prayer, i) => (
          <motion.div
            key={prayer}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <PrayerCard
              prayer={prayer}
              log={viewLogMap[prayer]}
              onToggle={handleTogglePrayer}
              onUpdateDetail={handleUpdateDetail}
            />
          </motion.div>
        ))}
      </div>

      {/* ── Quran ── */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Quran
        </h3>
        <QuranCard
          quranRead={quranRead}
          quranPages={quranPages}
          onToggle={handleQuranToggle}
          onPagesChange={handleQuranPages}
        />
      </div>

      {/* ── Heatmap (bottom of page) ── */}
      <HeatmapCalendar logsByDate={logsByDate} />
    </div>
  );
}
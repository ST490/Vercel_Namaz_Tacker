import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { PRAYERS, getTodayStr, computeStreak, computeLongestStreak } from '@/lib/prayerUtils';
import PrayerCard from '@/components/tracker/PrayerCard';
import QuranCard from '@/components/tracker/QuranCard';
import StreakBanner from '@/components/tracker/StreakBanner';
import HeatmapCalendar from '@/components/tracker/HeatmapCalendar';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const today = getTodayStr();

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

  const todayLogs = useMemo(() => logsByDate[today] || [], [logsByDate, today]);

  const todayLogMap = useMemo(() => {
    const map = {};
    todayLogs.forEach(log => { map[log.prayer_name] = log; });
    return map;
  }, [todayLogs]);

  const quranLog = todayLogs.find(l => l.quran_read !== undefined && l.quran_read);
  const quranRead = !!quranLog;
  const quranPages = quranLog?.quran_pages || todayLogs[0]?.quran_pages || 0;

  const completedToday = todayLogs.filter(l => l.completed).length;
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
    const existing = todayLogMap[prayerName];
    if (completed) {
      if (existing) {
        updateMutation.mutate({ id: existing.id, data: { completed: true, timeliness: 'on_time', location: 'home', composition: 'fard_only' } });
      } else {
        createMutation.mutate({ date: today, prayer_name: prayerName, completed: true, timeliness: 'on_time', location: 'home', composition: 'fard_only' });
      }
    } else {
      if (existing) {
        deleteMutation.mutate(existing.id);
      }
    }
  };

  const handleUpdateDetail = async (prayerName, field, value) => {
    const existing = todayLogMap[prayerName];
    if (existing) {
      updateMutation.mutate({ id: existing.id, data: { [field]: value } });
    }
  };

  const handleQuranToggle = async () => {
    const firstLog = todayLogs[0];
    if (quranRead) {
      if (firstLog) {
        updateMutation.mutate({ id: firstLog.id, data: { quran_read: false, quran_pages: 0 } });
      }
    } else {
      if (firstLog) {
        updateMutation.mutate({ id: firstLog.id, data: { quran_read: true } });
      } else {
        createMutation.mutate({ date: today, prayer_name: 'fajr', completed: false, quran_read: true, quran_pages: 0 });
      }
    }
  };

  const handleQuranPages = async (pages) => {
    const firstLog = todayLogs.find(l => l.quran_read) || todayLogs[0];
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

  return (
    <div className="space-y-4">
      {/* Date header */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {format(new Date(), 'EEEE')}
        </p>
        <h2 className="font-heading text-2xl font-bold text-foreground">
          {format(new Date(), 'MMMM d, yyyy')}
        </h2>
      </div>

      {/* Streak Banner */}
      <StreakBanner
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        completedToday={completedToday}
        totalPrayers={5}
      />

      {/* Prayer Cards */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Daily Prayers
        </h3>
        {PRAYERS.map((prayer, i) => (
          <motion.div
            key={prayer}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <PrayerCard
              prayer={prayer}
              log={todayLogMap[prayer]}
              onToggle={handleTogglePrayer}
              onUpdateDetail={handleUpdateDetail}
            />
          </motion.div>
        ))}
      </div>

      {/* Quran */}
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

      {/* Heatmap */}
      <HeatmapCalendar logsByDate={logsByDate} />
    </div>
  );
}
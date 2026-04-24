import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy } from 'lucide-react';

export default function StreakBanner({ currentStreak, longestStreak, completedToday, totalPrayers }) {
  const progress = totalPrayers > 0 ? (completedToday / totalPrayers) * 100 : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Flame className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{currentStreak}</span>
            <span className="text-xs text-muted-foreground">day streak</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Best: {longestStreak}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Today's Progress
          </span>
          <span className="text-xs font-semibold text-foreground">
            {completedToday}/{totalPrayers}
          </span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}
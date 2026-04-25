import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy } from 'lucide-react';

export default function StreakBanner({ currentStreak, longestStreak, completedToday, totalPrayers }) {
  const progress = totalPrayers > 0 ? (completedToday / totalPrayers) * 100 : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-11 h-11 flex items-center justify-center">
            {/* Background Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="22"
                cy="22"
                r="19"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                className="text-secondary/50"
              />
              {/* Progress Ring */}
              <motion.circle
                cx="22"
                cy="22"
                r="19"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 19}
                initial={{ strokeDashoffset: 2 * Math.PI * 19 }}
                animate={{ strokeDashoffset: (2 * Math.PI * 19) * (1 - progress / 100) }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                className="text-orange-500"
                strokeLinecap="round"
              />
            </svg>
            <Flame className="w-6 h-6 text-orange-500 fill-orange-500/20 relative z-10 drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-foreground tracking-tighter leading-none">{currentStreak}</span>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">day streak</span>
            </div>
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
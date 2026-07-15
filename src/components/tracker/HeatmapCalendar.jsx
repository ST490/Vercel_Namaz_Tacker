import React from 'react';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import { getHeatmapColor, computeDayScore } from '@/lib/prayerUtils';
import { useTheme } from '@/lib/ThemeContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function HeatmapCalendar({ logsByDate }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const today = new Date();
  const totalWeeks = 16;

  const startDate = startOfWeek(subDays(today, (totalWeeks - 1) * 7), { weekStartsOn: 0 });
  const weeks = [];

  for (let w = 0; w < totalWeeks; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(startDate, w * 7 + d);
      const dateStr = format(date, 'yyyy-MM-dd');
      const logs = logsByDate[dateStr] || [];
      const score = computeDayScore(logs);
      const completed = logs.filter(l => l.completed).length;
      week.push({ date, dateStr, score, completed, isToday: dateStr === format(today, 'yyyy-MM-dd'), isFuture: date > today });
    }
    weeks.push(week);
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">
        Prayer Consistency
      </h3>
      <TooltipProvider delayDuration={200}>
        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1">
            {dayLabels.map((label, i) => (
              <div key={i} className="w-3 h-3 flex items-center justify-center">
                <span className="text-[7px] text-muted-foreground">{i % 2 === 1 ? label : ''}</span>
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day) => (
                <Tooltip key={day.dateStr}>
                  <TooltipTrigger asChild>
                    <div
                      className={`w-3 h-3 rounded-sm transition-all duration-200 ${
                        day.isToday ? 'ring-1 ring-primary ring-offset-1 ring-offset-background' : ''
                      } ${day.isFuture ? 'opacity-20' : 'hover:scale-125 cursor-default'}`}
                      style={{
                        backgroundColor: day.isFuture
                          ? (isDark ? 'hsl(0, 0%, 8%)' : 'hsl(45, 15%, 94%)')
                          : getHeatmapColor(day.score, isDark)
                      }}
                    />
                  </TooltipTrigger>
                  {!day.isFuture && (
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-medium">{format(day.date, 'MMM d, yyyy')}</p>
                      <p className="text-muted-foreground">{day.completed}/5 prayers</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </TooltipProvider>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[9px] text-muted-foreground">Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((score) => (
          <div
            key={score}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getHeatmapColor(score, isDark) }}
          />
        ))}
        <span className="text-[9px] text-muted-foreground">More</span>
      </div>
    </div>
  );
}
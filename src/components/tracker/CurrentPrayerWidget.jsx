import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock, MapPin, Loader2 } from 'lucide-react';
import { usePrayerTimes, getCurrentPrayer } from '@/hooks/usePrayerTimes';
import { format } from 'date-fns';

const PRAYER_ORDER = [
  { key: 'fajr',    label: 'Fajr',    icon: '🌅' },
  { key: 'dhuhr',   label: 'Dhuhr',   icon: '☀️' },
  { key: 'asr',     label: 'Asr',     icon: '🌤️' },
  { key: 'maghrib', label: 'Maghrib', icon: '🌇' },
  { key: 'isha',    label: 'Isha',    icon: '🌙' },
];

export default function CurrentPrayerWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [now, setNow] = useState(new Date());
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: prayerData, isLoading, error } = usePrayerTimes(today);

  // Refresh "now" every minute so time-left stays accurate
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const currentPrayer = prayerData ? getCurrentPrayer(prayerData.timings) : null;

  // Determine which prayer is "next" for the full list
  const getRowStyle = (prayerKey) => {
    if (!currentPrayer) return '';
    if (prayerKey === currentPrayer.key) return 'active';
    const currentIdx = PRAYER_ORDER.findIndex(p => p.key === currentPrayer.key);
    const thisIdx = PRAYER_ORDER.findIndex(p => p.key === prayerKey);
    return thisIdx < currentIdx ? 'past' : 'upcoming';
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden cursor-pointer card-gold-border"
      style={{
        background: 'hsl(var(--card))',
        borderColor: 'rgba(255, 215, 0, 0.18)',
      }}
      onClick={() => setIsExpanded(e => !e)}
    >
      {/* Collapsed / Header Row */}
      <div className="px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'rgba(255,215,0,0.12)' }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              currentPrayer?.icon || '🕌'
            )}
          </div>
          <div>
            {isLoading ? (
              <div className="h-4 w-32 rounded bg-secondary animate-pulse" />
            ) : error ? (
              <p className="text-sm font-semibold text-muted-foreground">Prayer Timings</p>
            ) : (
              <>
                <p className="text-sm font-bold text-foreground leading-tight">
                  🕌 {currentPrayer?.label}
                  {currentPrayer?.isTomorrow ? ' — Tomorrow' : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentPrayer?.isTomorrow
                    ? `Starts in ${currentPrayer.timeLeft}`
                    : `Ends in ${currentPrayer.timeLeft}`}
                </p>
              </>
            )}
          </div>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </div>

      {/* Expanded: full timings list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 pt-1 space-y-1"
              style={{ borderTop: '1px solid rgba(255,215,0,0.08)' }}
            >
              {isLoading ? (
                <div className="space-y-2 py-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 rounded-lg bg-secondary animate-pulse" />
                  ))}
                </div>
              ) : error ? (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  <MapPin className="w-4 h-4 mx-auto mb-1 opacity-50" />
                  <p>Set your location in Settings to load timings</p>
                </div>
              ) : (
                PRAYER_ORDER.map((prayer) => {
                  const rowStyle = getRowStyle(prayer.key);
                  const timeStr = prayerData?.timings[prayer.key] || '--:--';
                  const isActive = rowStyle === 'active';
                  const isPast = rowStyle === 'past';

                  return (
                    <div
                      key={prayer.key}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={isPast ? 'grayscale opacity-50' : ''}>{prayer.icon}</span>
                        <span
                          className={`text-sm font-medium ${
                            isActive
                              ? 'text-primary font-bold'
                              : isPast
                              ? 'text-muted-foreground line-through'
                              : 'text-foreground'
                          }`}
                        >
                          {prayer.label}
                        </span>
                        {isActive && (
                          <span className="text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                            NOW
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span
                          className={`text-sm tabular-nums ${
                            isActive ? 'text-primary font-bold' : isPast ? 'text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {timeStr}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

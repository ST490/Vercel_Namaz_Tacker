import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock, MapPin, Loader2 } from 'lucide-react';
import { usePrayerTimes, getCurrentPrayer } from '@/hooks/usePrayerTimes';
import { format, parse } from 'date-fns';

const PRAYER_ORDER = [
  { key: 'fajr',    label: 'Fajr',    icon: '🌅' },
  { key: 'dhuhr',   label: 'Dhuhr',   icon: '☀️' },
  { key: 'asr',     label: 'Asr',     icon: '🌤️' },
  { key: 'maghrib', label: 'Maghrib', icon: '🌇' },
  { key: 'isha',    label: 'Isha',    icon: '🌙' },
];

import PrayerIcon from './PrayerIcon';

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

  const formatPrayerTime = (timeStr) => {
    try {
      return format(parse(timeStr.split(' ')[0], 'HH:mm', new Date()), 'h:mm a');
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <div
      className="rounded-[2rem] border overflow-hidden cursor-pointer shadow-sm transition-all hover:shadow-md"
      style={{
        background: 'hsl(var(--card))',
        borderColor: 'rgba(255, 215, 0, 0.12)',
      }}
      onClick={() => setIsExpanded(e => !e)}
    >
      {/* Collapsed / Header Row - Premium Design */}
      <div className="px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Large Square Icon Container */}
          {isLoading ? (
            <div className="w-14 h-14 rounded-2xl bg-secondary animate-pulse flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            <PrayerIcon prayer={currentPrayer?.key} size="lg" />
          )}

          <div className="space-y-1">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-6 w-24 rounded bg-secondary animate-pulse" />
                <div className="h-4 w-32 rounded bg-secondary animate-pulse" />
              </div>
            ) : error ? (
              <p className="text-sm font-semibold text-muted-foreground">Prayer Timings</p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-cutoff font-extrabold tracking-tight text-[#1B4332] dark:text-primary">
                    {currentPrayer?.label}
                  </h3>
                  <span className="text-muted-foreground/30 text-xl font-light">•</span>
                  <span className="text-base font-medium text-muted-foreground pt-0.5">
                    {prayerData?.timings[currentPrayer?.key]
                      ? formatPrayerTime(prayerData.timings[currentPrayer.key])
                      : '--:--'}
                  </span>
                </div>

                <div className="flex">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#E7F3EF] text-[#1B4332] dark:bg-primary/20 dark:text-primary border border-[#1B4332]/5">
                    {currentPrayer?.isTomorrow ? 'STARTS' : 'ENDS'} IN {currentPrayer?.timeLeft.toUpperCase()}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="text-muted-foreground/40 p-1"
        >
          <ChevronDown className="w-6 h-6" />
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
                        <div className={isPast ? 'opacity-50 grayscale' : ''}>
                          <PrayerIcon prayer={prayer.key} size="sm" />
                        </div>
                        <span
                          className={`text-sm font-cutoff ${
                            isActive
                              ? 'text-primary font-bold'
                              : isPast
                              ? 'text-muted-foreground line-through'
                              : 'text-foreground font-medium'
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
                          className={`text-sm font-cutoff tabular-nums ${
                            isActive ? 'text-primary font-bold' : isPast ? 'text-muted-foreground' : 'text-foreground font-medium'
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

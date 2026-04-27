import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MapPin, Clock, BookOpen, ChevronDown } from 'lucide-react';
import { PRAYER_LABELS, PRAYER_ICONS, LOCATION_LABELS, TIMELINESS_LABELS, COMPOSITION_LABELS } from '@/lib/prayerUtils';
import { Button } from '@/components/ui/button';

import PrayerIcon from './PrayerIcon';

export default function PrayerCard({ prayer, log, onToggle, onUpdateDetail }) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = log?.completed;

  const handleToggle = () => {
    onToggle(prayer, !isCompleted);
  };

  return (
    <motion.div
      layout
      className={`rounded-2xl border transition-all duration-500 overflow-hidden ${
        isCompleted
          ? 'border-primary/30 bg-primary/[0.03] shadow-inner'
          : 'border-border/50 bg-card/50 backdrop-blur-sm shadow-sm'
      }`}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Check circle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleToggle}
          className={`relative flex-shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
            isCompleted
              ? 'border-primary bg-primary shadow-lg shadow-primary/20'
              : 'border-muted-foreground/20 hover:border-primary/40 bg-secondary/30'
          }`}
        >
          <AnimatePresence>
            {isCompleted && (
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="z-10"
              >
                <Check className="w-6 h-6 text-primary-foreground" strokeWidth={3.5} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ripple effect */}
          <AnimatePresence>
            {isCompleted && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0 rounded-full bg-primary"
              />
            )}
          </AnimatePresence>
        </motion.button>

        {/* Prayer info */}
        <div className="flex-1 flex items-center gap-4 min-w-0">
          <PrayerIcon prayer={prayer} size="md" />
          
          <div className="flex-1 min-w-0">
            <h3 className={`text-base font-cutoff font-bold tracking-tight transition-colors ${
              isCompleted ? 'text-primary' : 'text-foreground'
            }`}>
              {PRAYER_LABELS[prayer]}
            </h3>
            {isCompleted && log && (
              <div className="flex items-center gap-2 mt-1">
                {log.location && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full">
                    {LOCATION_LABELS[log.location]?.split(' ')[0]}
                  </span>
                )}
                {log.timeliness && (
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    log.timeliness === 'on_time' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                  }`}>
                    {TIMELINESS_LABELS[log.timeliness]}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expand button */}
        {isCompleted && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </motion.button>
        )}
      </div>

      {/* Details Panel */}
      <AnimatePresence>
        {expanded && isCompleted && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 space-y-2.5 border-t border-border/50 pt-2.5">
              {/* Location */}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1.5">
                  <MapPin className="w-3 h-3" /> Location
                </label>
                <div className="flex gap-1.5">
                  {Object.entries(LOCATION_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => onUpdateDetail(prayer, 'location', key)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                        log?.location === key
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeliness */}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1.5">
                  <Clock className="w-3 h-3" /> Timeliness
                </label>
                <div className="flex gap-1.5">
                  {Object.entries(TIMELINESS_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => onUpdateDetail(prayer, 'timeliness', key)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                        log?.timeliness === key
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Composition */}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1.5">
                  <BookOpen className="w-3 h-3" /> Composition
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(COMPOSITION_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => onUpdateDetail(prayer, 'composition', key)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                        log?.composition === key
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
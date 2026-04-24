import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

const MILESTONES = [33, 66, 99];
const MILESTONE_LABELS = {
  33: 'سُبْحَانَ ٱللَّٰهِ',
  66: 'ٱلْحَمْدُ لِلَّٰهِ',
  99: 'ٱللَّٰهُ أَكْبَرُ',
};
const MILESTONE_TRANSLITERATION = {
  33: 'SubhanAllah',
  66: 'Alhamdulillah',
  99: 'Allahu Akbar',
};

const STORAGE_KEY = 'tasbeeh_count';

function loadCount() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && saved.date === new Date().toDateString()) {
      return saved.count;
    }
  } catch {/* ignore */}
  return 0;
}

function saveCount(count) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ count, date: new Date().toDateString() }));
}

// SVG progress ring
function ProgressRing({ count, size = 160, strokeWidth = 8 }) {
  const effectiveCount = count % 100 || (count > 0 && count % 100 === 0 ? 100 : 0);
  const progress = effectiveCount / 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  // Color shifts between milestones
  const color = count >= 99 ? '#FFD700' : count >= 66 ? '#FFA500' : count >= 33 ? '#FFD700' : '#FFD700';

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0 -rotate-90"
      style={{ pointerEvents: 'none' }}
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,215,0,0.1)"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </svg>
  );
}

export default function TasbeehCounter() {
  const [count, setCount] = useState(loadCount);
  const [ripples, setRipples] = useState([]);
  const [flash, setFlash] = useState(false);
  const [milestone, setMilestone] = useState(null);
  const rippleId = useRef(0);

  // Milestone detection
  const prevCount = useRef(count);
  useEffect(() => {
    if (MILESTONES.includes(count) && count !== prevCount.current) {
      setMilestone(count);
      const timer = setTimeout(() => setMilestone(null), 2000);
      return () => clearTimeout(timer);
    }
    prevCount.current = count;
  }, [count]);

  const handleTap = useCallback((e) => {
    const newCount = count + 1;
    setCount(newCount);
    saveCount(newCount);

    // Visual flash
    setFlash(true);
    setTimeout(() => setFlash(false), 400);

    // Add ripple
    const id = ++rippleId.current;
    setRipples(prev => [...prev, id]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r !== id));
    }, 600);
  }, [count]);

  const handleReset = () => {
    setCount(0);
    saveCount(0);
    setMilestone(null);
  };

  const currentLabel = MILESTONES.find(m => count < m) || 99;
  const progressToNext = currentLabel
    ? ((count % currentLabel) / currentLabel) * 100
    : 100;

  // Current dhikr label
  const getDhikrLabel = () => {
    if (count < 33) return { ar: 'سُبْحَانَ ٱللَّٰهِ', tr: 'SubhanAllah', next: 33 };
    if (count < 66) return { ar: 'ٱلْحَمْدُ لِلَّٰهِ', tr: 'Alhamdulillah', next: 66 };
    if (count < 99) return { ar: 'ٱللَّٰهُ أَكْبَرُ', tr: 'Allahu Akbar', next: 99 };
    return { ar: 'ٱللَّٰهُ أَكْبَرُ', tr: 'Allahu Akbar', next: null };
  };
  const dhikr = getDhikrLabel();

  const RING_SIZE = 200;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Count and Dhikr label */}
      <div className="text-center space-y-1">
        <p className="font-heading text-2xl text-foreground" dir="rtl">{dhikr.ar}</p>
        <p className="text-xs text-muted-foreground">{dhikr.tr}</p>
        {dhikr.next && (
          <p className="text-[10px] text-muted-foreground/70">
            {dhikr.next - count} more to {MILESTONE_TRANSLITERATION[dhikr.next]}
          </p>
        )}
      </div>

      {/* Tap circle */}
      <div className="relative flex items-center justify-center" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <ProgressRing count={count} size={RING_SIZE} strokeWidth={10} />

        {/* Ripple layers */}
        {ripples.map(id => (
          <div
            key={id}
            className="absolute inset-0 rounded-full border-2 border-primary tasbeeh-ripple"
            style={{ pointerEvents: 'none' }}
          />
        ))}

        {/* Main button */}
        <button
          onClick={handleTap}
          className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center select-none transition-transform active:scale-95 ${flash ? 'tasbeeh-flash' : ''}`}
          style={{
            background: 'radial-gradient(circle at 40% 35%, rgba(255,215,0,0.18) 0%, rgba(255,215,0,0.06) 60%, transparent 100%)',
            border: '2px solid rgba(255,215,0,0.25)',
            boxShadow: '0 0 40px rgba(255,215,0,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
          aria-label={`Tasbeeh count: ${count}. Tap to increment.`}
        >
          <motion.span
            key={count}
            initial={{ scale: 1.3, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-5xl font-bold tabular-nums text-foreground"
          >
            {count}
          </motion.span>
          <span className="text-[10px] text-muted-foreground mt-1">Tap to count</span>
        </button>
      </div>

      {/* Milestone toast */}
      <AnimatePresence>
        {milestone && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="px-4 py-2 rounded-full text-center"
            style={{
              background: 'rgba(255,215,0,0.12)',
              border: '1px solid rgba(255,215,0,0.3)',
            }}
          >
            <p className="font-heading text-sm text-primary" dir="rtl">
              {MILESTONE_LABELS[milestone]}
            </p>
            <p className="text-[10px] text-muted-foreground">{milestone} — {MILESTONE_TRANSLITERATION[milestone]}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Milestones row */}
      <div className="flex gap-3">
        {MILESTONES.map(m => (
          <div
            key={m}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
              count >= m
                ? 'bg-primary/10 border border-primary/30'
                : 'border border-border'
            }`}
          >
            <span className={`text-xs font-bold ${count >= m ? 'text-primary' : 'text-muted-foreground'}`}>
              {m}
            </span>
            <span className={`text-[9px] ${count >= m ? 'text-primary/70' : 'text-muted-foreground/50'}`}>
              {MILESTONE_TRANSLITERATION[m]}
            </span>
            {count >= m && <span className="text-[8px] text-primary">✓</span>}
          </div>
        ))}
      </div>

      {/* Reset */}
      <button
        onClick={handleReset}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary"
      >
        <RotateCcw className="w-3 h-3" />
        Reset Counter
      </button>
    </div>
  );
}

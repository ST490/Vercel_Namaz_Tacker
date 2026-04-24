import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, BookOpen, Plus, Minus } from 'lucide-react';

export default function QuranCard({ quranRead, quranPages, onToggle, onPagesChange }) {
  return (
    <motion.div
      layout
      className={`rounded-xl border transition-all duration-300 overflow-hidden ${
        quranRead
          ? 'border-primary/40 bg-primary/5'
          : 'border-border bg-card'
      }`}
    >
      <div className="flex items-center gap-3 p-3.5">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onToggle}
          className={`relative flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
            quranRead
              ? 'border-primary bg-primary'
              : 'border-muted-foreground/30 hover:border-primary/50'
          }`}
        >
          <AnimatePresence>
            {quranRead && (
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <Check className="w-5 h-5 text-primary-foreground" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {quranRead && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0.6 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 rounded-full bg-primary"
              />
            )}
          </AnimatePresence>
        </motion.button>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">📖</span>
            <h3 className={`font-semibold text-sm transition-colors ${
              quranRead ? 'text-primary' : 'text-foreground'
            }`}>
              Quran Reading
            </h3>
          </div>
          {quranRead && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {quranPages > 0 ? `${quranPages} pages read` : 'Tap + to log pages'}
            </p>
          )}
        </div>

        {quranRead && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPagesChange(Math.max(0, (quranPages || 0) - 1))}
              className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-sm font-semibold w-6 text-center">{quranPages || 0}</span>
            <button
              onClick={() => onPagesChange((quranPages || 0) + 1)}
              className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
import React from 'react';
import { Compass } from 'lucide-react';

const KaabaIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-primary drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
    {/* Base Cube Isometric */}
    <path d="M12 21l8-4V9l-8-4-8 4v8l8 4z" />
    <path d="M4 9l8 4 8-4" />
    <path d="M12 13v8" />
    {/* Gold trim (kiswah band) */}
    <path d="M4.5 11l7.5 3.75 7.5-3.75" strokeWidth="1.5" className="opacity-80" />
    <path d="M5.5 13l6.5 3.25 6.5-3.25" strokeWidth="0.5" className="opacity-60" />
  </svg>
);

export default function QiblaPointer() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden h-[300px]">

      {/* Title */}
      <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Qibla Pointer</h3>

      {/* Compass Face (Inactive) */}
      <div className="relative w-32 h-32 mb-6 opacity-50 grayscale">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border border-border shadow-inner bg-secondary/20" />
        <div className="absolute inset-2 rounded-full border-[0.5px] border-primary/20" />

        {/* Center Kaaba Motif */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-card/80 backdrop-blur-sm rounded-full p-2">
            <KaabaIcon />
          </div>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="mt-2 space-y-2 z-10">
        <div className="bg-primary/20 text-primary border border-primary/30 text-xs font-bold px-4 py-1.5 rounded-full inline-block">
          Coming Soon
        </div>
        <p className="text-[10px] text-muted-foreground max-w-[200px] leading-tight mx-auto flex items-center justify-center gap-1">
          <Compass className="w-3 h-3" />
          Under Construction
        </p>
      </div>
    </div>
  );
}

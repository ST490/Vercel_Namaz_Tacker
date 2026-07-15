import React from 'react';
import { Sunrise, Sun, CloudSun, Sunset, Moon } from 'lucide-react';

const ICON_CONFIG = {
  fajr: { 
    Icon: Sunrise, 
    bg: 'bg-gradient-to-b from-[#D484B6] to-[#F3B290]', // Dawn pink to orange
    color: 'text-white'
  },
  dhuhr: { 
    Icon: Sun, 
    bg: 'bg-gradient-to-b from-[#A0D2FF] to-[#D4A972]', // Midday blue to sand
    color: 'text-white'
  },
  asr: { 
    Icon: CloudSun, 
    bg: 'bg-gradient-to-b from-[#68C2FF] to-[#D38048]', // Afternoon blue to warm brown
    color: 'text-white'
  },
  maghrib: { 
    Icon: Sunset, 
    bg: 'bg-gradient-to-b from-[#8B1E3F] to-[#D85841]', // Sunset crimson to orange
    color: 'text-white'
  },
  isha: { 
    Icon: Moon, 
    bg: 'bg-gradient-to-b from-[#091034] to-[#507698]', // Night navy to moonlight blue
    color: 'text-white'
  },
};

export default function PrayerIcon({ prayer, size = "md" }) {
  const config = ICON_CONFIG[prayer] || ICON_CONFIG.fajr;
  const { Icon, color, bg } = config;

  // Arch window shape
  const sizeClasses = {
    sm: "w-8 h-10 rounded-t-full rounded-b-[6px]",
    md: "w-11 h-14 rounded-t-full rounded-b-[8px]",
    lg: "w-14 h-16 rounded-t-full rounded-b-[10px]"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7"
  };

  return (
    <div className={`${sizeClasses[size]} flex-shrink-0 ${bg} flex items-center justify-center transition-transform duration-500 shadow-md overflow-hidden relative group`}>
      
      {/* Subtle inner glow/border for the window effect */}
      <div className="absolute inset-0 border-[1.5px] border-white/20 rounded-t-full rounded-b-[inherit] pointer-events-none" />
      
      {/* Icon positioned slightly higher to fit the arch */}
      <div className="relative z-10 -mt-1 drop-shadow-md">
        <Icon className={`${iconSizes[size]} ${color}`} strokeWidth={2.5} fill="currentColor" fillOpacity={0.2} />
      </div>

      {/* Decorative ground line at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-black/15" />
    </div>
  );
}

import React from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { Moon, Sun, Info, Heart } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function AppSettings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-heading text-2xl font-bold text-foreground">Settings</h2>
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-[10px] text-muted-foreground">Gold & Black theme</p>
            </div>
          </div>
          <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
        </div>
      </div>

      {/* About */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">About</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Namaz Tracker helps you build and maintain your daily prayer habits with a gamified experience.
          Track your 5 daily prayers, log Quran reading, and make up missed (Qaza) prayers systematically.
        </p>
        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
          <span>Made with</span>
          <Heart className="w-3 h-3 text-destructive fill-destructive" />
          <span>for the Ummah</span>
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Heatmap Legend</h3>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>🟩 <strong className="text-foreground">Brightest:</strong> All 5 prayers on time + mosque + Quran</p>
          <p>🟨 <strong className="text-foreground">Medium:</strong> 3-4 prayers completed</p>
          <p>🟫 <strong className="text-foreground">Faded:</strong> 1-2 prayers completed</p>
          <p>⬛ <strong className="text-foreground">Empty:</strong> No prayers logged</p>
        </div>
      </div>

      {/* Scoring */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Scoring System</h3>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p>• Each prayer completed: <strong className="text-foreground">+2 pts</strong></p>
          <p>• Prayed at mosque: <strong className="text-foreground">+1 pt</strong></p>
          <p>• On time: <strong className="text-foreground">+1 pt</strong></p>
          <p>• Fard + Sunnah: <strong className="text-foreground">+0.5 pts</strong></p>
          <p>• Fard + Sunnah + Nafl: <strong className="text-foreground">+1 pt</strong></p>
          <p>• Quran reading: <strong className="text-foreground">+2 pts</strong></p>
        </div>
      </div>
    </div>
  );
}
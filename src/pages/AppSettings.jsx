import React, { useState } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';
import { useLocation } from '@/lib/LocationContext';
import { Moon, Sun, Info, Heart, User, LogOut, MapPin, Loader2, Navigation } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export default function AppSettings() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { location, school, setSchool, isLocating, locationError, requestGeolocation, setCity } = useLocation();
  const { toast } = useToast();

  const [cityInput, setCityInput] = useState(location?.city || '');

  const handleSaveCity = () => {
    if (!cityInput.trim()) return;
    setCity(cityInput.trim());
    toast({ description: `Location set to "${cityInput.trim()}"` });
  };

  const handleRequestGeo = () => {
    requestGeolocation();
  };

  const locationDisplay = () => {
    if (!location) return 'Not set (defaulting to Karachi)';
    if (location.type === 'coords') return `GPS: ${location.lat?.toFixed(4)}, ${location.lon?.toFixed(4)}`;
    if (location.type === 'city') return location.city;
    return 'Not set';
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-heading text-2xl font-bold text-foreground">Settings</h2>
      </div>

      {/* ── Account ── */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        <div className="flex items-center gap-3 p-4">
          <User className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Account</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {user?.isGuest ? 'Guest Session' : `@${user?.username}`}
            </p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
            {user?.isGuest ? 'Guest' : 'User'}
          </span>
        </div>

        {/* Sign Out */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/50 transition-colors group"
        >
          <LogOut className="w-5 h-5 text-destructive/70 group-hover:text-destructive transition-colors flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive/80 group-hover:text-destructive transition-colors">
              Sign Out
            </p>
            <p className="text-[10px] text-muted-foreground">End your current session</p>
          </div>
        </button>
      </div>

      {/* ── Location Settings ── */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Location Settings</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Used to load accurate prayer timings and Hijri dates. Your location stays on your device.
        </p>

        {/* Current location display */}
        <div className="px-3 py-2 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Current: </span>
          {locationDisplay()}
        </div>

        {/* GPS button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleRequestGeo}
          disabled={isLocating}
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 mr-2" />
          )}
          {isLocating ? 'Getting Location…' : 'Use My Location (GPS)'}
        </Button>

        {locationError && (
          <p className="text-xs text-destructive">{locationError}</p>
        )}

        {/* Manual city input */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground block">
            Or enter City / Country manually
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Karachi, Pakistan"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveCity()}
              className="flex-1"
            />
            <Button onClick={handleSaveCity} disabled={!cityInput.trim()} size="sm">
              Save
            </Button>
          </div>
        </div>

        {/* School of Thought Setting */}
        <div className="space-y-2 pt-2 border-t border-border">
          <label className="text-xs font-medium text-muted-foreground block">
            Asr Calculation Method (School of Thought)
          </label>
          <Select value={school} onValueChange={(val) => setSchool(val)}>
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="Select School" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Standard (Shafi, Maliki, Hanbali)</SelectItem>
              <SelectItem value="1">Hanafi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Theme Toggle ── */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-[10px] text-muted-foreground">
                {theme === 'dark' ? 'Royal Night & Gold theme' : 'Light theme'}
              </p>
            </div>
          </div>
          <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
        </div>
      </div>

      {/* ── Scoring System ── */}
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

      {/* ── Heatmap Legend ── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Heatmap Legend</h3>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>🟩 <strong className="text-foreground">Brightest:</strong> All 5 prayers on time + mosque + Quran</p>
          <p>🟨 <strong className="text-foreground">Medium:</strong> 3-4 prayers completed</p>
          <p>🟫 <strong className="text-foreground">Faded:</strong> 1-2 prayers completed</p>
          <p>⬛ <strong className="text-foreground">Empty:</strong> No prayers logged</p>
        </div>
      </div>

      {/* ── About ── */}
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
    </div>
  );
}
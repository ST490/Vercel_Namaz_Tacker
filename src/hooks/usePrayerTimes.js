import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useLocation } from '@/lib/LocationContext';

const BASE = 'https://api.aladhan.com/v1';

async function fetchTimings(location, dateStr) {
  const [day, month, year] = dateStr.split('-'); // yyyy-MM-dd → reformat to DD-MM-YYYY
  const aladhanDate = `${year.slice(-2) ? dateStr : dateStr}`; // keep as is, API accepts both

  // Format date as DD-MM-YYYY for the Aladhan API path
  const dateObj = new Date(dateStr);
  const ddmmyyyy = format(dateObj, 'dd-MM-yyyy');

  let url;
  if (location && location.type === 'coords' && location.lat && location.lon) {
    url = `${BASE}/timings/${ddmmyyyy}?latitude=${location.lat}&longitude=${location.lon}&method=1`;
  } else if (location && location.type === 'city' && location.city) {
    const encodedCity = encodeURIComponent(location.city);
    url = `${BASE}/timingsByCity/${ddmmyyyy}?city=${encodedCity}&method=1`;
  } else {
    // Default: Karachi as a sensible Islamic city default
    url = `${BASE}/timingsByCity/${ddmmyyyy}?city=Karachi&country=Pakistan&method=1`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch prayer timings');
  const json = await res.json();

  if (json.code !== 200) throw new Error(json.data || 'API error');

  const { timings, date } = json.data;

  // Map Aladhan keys to our internal names
  return {
    timings: {
      fajr: timings.Fajr,
      dhuhr: timings.Dhuhr,
      asr: timings.Asr,
      maghrib: timings.Maghrib,
      isha: timings.Isha,
      sunrise: timings.Sunrise,
      sunset: timings.Sunset,
    },
    hijri: {
      day: date.hijri.day,
      month: date.hijri.month.en,
      monthAr: date.hijri.month.ar,
      year: date.hijri.year,
      formatted: `${date.hijri.day} ${date.hijri.month.en} ${date.hijri.year} AH`,
    },
    gregorian: date.readable,
  };
}

/**
 * Returns prayer timings + Hijri date for a given date (defaults to today).
 * Automatically uses the user's saved location from LocationContext.
 * Results are cached for 1 hour (prayer times don't change within a day).
 */
export function usePrayerTimes(dateStr) {
  const { location } = useLocation();
  const targetDate = dateStr || format(new Date(), 'yyyy-MM-dd');

  // Build a stable query key that changes when location changes
  const locationKey = location
    ? (location.type === 'coords' ? `${location.lat},${location.lon}` : location.city)
    : 'default';

  return useQuery({
    queryKey: ['prayer-timings', targetDate, locationKey],
    queryFn: () => fetchTimings(location, targetDate),
    staleTime: 1000 * 60 * 60,       // 1 hour
    gcTime: 1000 * 60 * 60 * 24,     // 24 hours
    retry: 2,
  });
}

/**
 * Given today's prayer timings, determine the current active prayer window.
 * Returns: { name, label, icon, endsAt, minutesLeft, startsAt }
 */
export function getCurrentPrayer(timings) {
  if (!timings) return null;

  const PRAYER_ORDER = [
    { key: 'fajr',    label: 'Fajr',    icon: '🌅' },
    { key: 'dhuhr',   label: 'Dhuhr',   icon: '☀️' },
    { key: 'asr',     label: 'Asr',     icon: '🌤️' },
    { key: 'maghrib', label: 'Maghrib', icon: '🌇' },
    { key: 'isha',    label: 'Isha',    icon: '🌙' },
  ];

  const now = new Date();

  // Parse "HH:MM" time string to today's Date object
  const toDate = (timeStr) => {
    const [h, m] = timeStr.replace(' (IST)', '').replace(' (PKT)', '').split(':').map(Number);
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d;
  };

  // Build list of prayer start times
  const starts = PRAYER_ORDER.map((p, i) => ({
    ...p,
    start: toDate(timings[p.key]),
    end: i < PRAYER_ORDER.length - 1 ? toDate(timings[PRAYER_ORDER[i + 1].key]) : null,
  }));

  // After Isha ends at midnight
  const midnight = new Date(now);
  midnight.setHours(23, 59, 59, 999);
  starts[starts.length - 1].end = midnight;

  // Find which prayer window we're in
  for (let i = 0; i < starts.length; i++) {
    const { key, label, icon, start, end } = starts[i];
    if (now >= start && now < end) {
      const msLeft = end - now;
      const minutesLeft = Math.floor(msLeft / 60000);
      const hoursLeft = Math.floor(minutesLeft / 60);
      const minsLeft = minutesLeft % 60;
      const timeLeft = hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m` : `${minsLeft}m`;
      return { key, label, icon, endsAt: end, timeLeft, startsAt: start, minutesLeft };
    }
  }

  // Before Fajr: today's Fajr is still upcoming
  // After Isha: tomorrow's Fajr
  const fajrStart = starts[0].start;
  let targetFajr;
  let isTomorrow = false;

  if (now < fajrStart) {
    // We're in the pre-Fajr window (e.g. midnight to Fajr)
    targetFajr = fajrStart;
  } else {
    // We're past Isha, next Fajr is tomorrow
    targetFajr = new Date(fajrStart);
    targetFajr.setDate(targetFajr.getDate() + 1);
    isTomorrow = true;
  }

  const msLeft = targetFajr - now;
  const minutesLeft = Math.floor(msLeft / 60000);
  const hoursLeft = Math.floor(minutesLeft / 60);
  const minsLeft = minutesLeft % 60;
  return {
    key: 'fajr',
    label: 'Fajr',
    icon: '🌅',
    endsAt: targetFajr,
    timeLeft: hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m` : `${minsLeft}m`,
    startsAt: fajrStart,
    minutesLeft,
    isTomorrow,
  };
}

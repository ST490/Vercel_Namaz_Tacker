/**
 * Seeds the local database with sample data on first run.
 * Only runs once — tracked via localStorage flag.
 */

const SEED_KEY = 'namaz_seeded_v1';
const DB_KEY = 'namaz_db';

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function makeLog(data) {
  const now = new Date().toISOString();
  return { id: generateId(), created_date: now, updated_date: now, ...data };
}

export function seedIfNeeded() {
  if (localStorage.getItem(SEED_KEY)) return;

  const prayerLogs = [
    { date: "2026-04-20", prayer_name: "fajr", completed: true, location: "mosque", timeliness: "on_time", composition: "fard_sunnah", quran_read: true, quran_pages: 3 },
    { date: "2026-04-20", prayer_name: "dhuhr", completed: true, location: "home", timeliness: "on_time", composition: "fard_only" },
    { date: "2026-04-19", prayer_name: "fajr", completed: true, location: "mosque", timeliness: "on_time", composition: "fard_sunnah", quran_read: true, quran_pages: 2 },
    { date: "2026-04-19", prayer_name: "dhuhr", completed: true, location: "home", timeliness: "on_time", composition: "fard_only" },
    { date: "2026-04-19", prayer_name: "asr", completed: true, location: "mosque", timeliness: "on_time", composition: "fard_sunnah" },
    { date: "2026-04-19", prayer_name: "maghrib", completed: true, location: "mosque", timeliness: "on_time", composition: "fard_sunnah" },
    { date: "2026-04-19", prayer_name: "isha", completed: true, location: "home", timeliness: "late", composition: "fard_only" },
    { date: "2026-04-18", prayer_name: "fajr", completed: true, location: "home", timeliness: "on_time", composition: "fard_only" },
    { date: "2026-04-18", prayer_name: "dhuhr", completed: true, location: "home", timeliness: "late", composition: "fard_only" },
    { date: "2026-04-18", prayer_name: "asr", completed: true, location: "home", timeliness: "on_time", composition: "fard_only" },
    { date: "2026-04-17", prayer_name: "fajr", completed: true, location: "mosque", timeliness: "on_time", composition: "fard_sunnah", quran_read: true, quran_pages: 5 },
    { date: "2026-04-17", prayer_name: "dhuhr", completed: true, location: "mosque", timeliness: "on_time", composition: "fard_sunnah" },
    { date: "2026-04-17", prayer_name: "asr", completed: true, location: "mosque", timeliness: "on_time", composition: "fard_sunnah" },
    { date: "2026-04-17", prayer_name: "maghrib", completed: true, location: "mosque", timeliness: "on_time", composition: "fard_sunnah" },
    { date: "2026-04-17", prayer_name: "isha", completed: true, location: "mosque", timeliness: "on_time", composition: "fard_sunnah_nafl" },
  ].map(makeLog);

  const qazaList = [
    { prayer_name: "fajr", total_missed: 120, completed_count: 45 },
    { prayer_name: "dhuhr", total_missed: 30, completed_count: 12 },
    { prayer_name: "asr", total_missed: 25, completed_count: 8 },
  ].map(makeLog);

  const db = { PrayerLog: prayerLogs, QazaTracker: qazaList };
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  localStorage.setItem(SEED_KEY, '1');
}
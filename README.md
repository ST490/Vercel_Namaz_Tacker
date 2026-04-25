# ☪️ Namaz Tracker

A beautiful, gamified, mobile-first web application designed to help Muslims track their 5 daily prayers, manage their Qaza (missed prayers) and Roza backlog, and maintain consistency.

## 🚀 Live Demo

**[Namaz Tracker on Vercel](https://namaz-tracker-mu.vercel.app)**

## ✨ Features

- **Comprehensive Dashboard**: Track your daily prayers with a date-based calendar picker, an accordion-style Current Prayer widget, and a consistency heatmap.
- **Advanced Scoring**: Get points based on prayer quality (On time, at Mosque, Sunnah, Nafl).
- **Qaza & Roza Tracker**: Easily log and manage your missed prayers and fasting backlog with visual progress.
- **Islamic Hub**: Access utilities including Gregorian/Hijri dates, accurate daily Namaz timings, and an interactive Tasbeeh counter with haptic-like visual feedback.
- **Geolocation Prayer Timings**: Integrated with the Aladhan API to automatically calculate accurate prayer times based on your configured location.
- **Local Authentication**: Isolated user profiles using a custom local username/password system, plus a Guest mode.
- **Offline Ready**: No database connection required, all data is safely stored in your browser's local storage.
- **Premium UI/UX**: Features a stunning "Royal Night & Gold" dark theme, built with Tailwind CSS, Framer Motion for animations, and Radix UI primitives. Includes a legacy Light Mode toggle.

## 💻 Tech Stack

- **Framework**: React 18 + Vite
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS + `clsx` + `tailwind-merge` + Custom CSS Variables
- **Components**: UI components inspired by shadcn/ui
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **APIs**: Aladhan API (for prayer timings & Hijri calendar)
- **Hosting**: Vercel

## 🛠️ Local Development

1. Clone the repository
   ```bash
   git clone https://github.com/ST490/Vercel_Namaz_Tacker.git
   cd "Vercel_Namaz_Tacker"
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## 🔒 Privacy & Data Storage

Namaz Tracker is fully client-side. **No data leaves your device**.
All prayer logs, profiles, and settings are saved in your browser's `localStorage` using isolated namespaces for different local accounts.

---
*Made with ❤️ for the Ummah.*

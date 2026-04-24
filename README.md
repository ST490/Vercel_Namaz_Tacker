# ☪️ Namaz Tracker

A beautiful, gamified, mobile-first web application designed to help Muslims track their 5 daily prayers, manage their Qaza (missed prayers) backlog, and log Quran reading consistency.

## 🚀 Live Demo

**[Namaz Tracker on Vercel](https://namaz-tracker-mu.vercel.app)**

## ✨ Features

- **Daily Dashboard**: Track your 5 daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha).
- **Advanced Scoring**: Get points based on prayer quality (On time, at Mosque, Sunnah, Nafl).
- **Qaza Tracker**: Easily log and manage your missed prayers backlog with visual progress.
- **Achievements & Badges**: Unlock badges for consistency (e.g., 7-day streak, 30-day Fajr streak).
- **Local Authentication**: Isolated user profiles using local storage, plus a Guest mode.
- **Offline Ready**: No database connection required, all data is safely stored in your browser's local storage.
- **Beautiful UI**: Built with Tailwind CSS, Framer Motion for animations, and Radix UI primitives. Includes Dark/Light mode toggle.

## 💻 Tech Stack

- **Framework**: React 18 + Vite
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS + `clsx` + `tailwind-merge`
- **Components**: UI components inspired by shadcn/ui
- **Icons**: Lucide React
- **Animations**: Framer Motion
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

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addDays,
  subDays
} from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays, Moon } from 'lucide-react';

// Helper to safely get Islamic date parts using native Intl API
function getIslamicDateParts(date) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
    const month = parts.find(p => p.type === 'month')?.value || '';
    const year = parseInt(parts.find(p => p.type === 'year')?.value?.split(' ')[0] || '1445', 10);
    return { day, month, year };
  } catch (e) {
    // Fallback if browser doesn't support islamic calendar
    return { day: 1, month: 'Muharram', year: 1445 };
  }
}

// Find the start date of the Islamic month that contains the given date
function getStartOfIslamicMonth(baseDate) {
  let d = new Date(baseDate);
  let parts = getIslamicDateParts(d);
  let currentMonth = parts.month;
  
  // Step backward until the month changes
  while (true) {
    let prevDay = subDays(d, 1);
    let prevParts = getIslamicDateParts(prevDay);
    if (prevParts.month !== currentMonth) {
      break;
    }
    d = prevDay;
    if (parts.day === 1) break; // sanity check
  }
  return d;
}

// Generate the days of the Islamic month
function getIslamicMonthDays(startOfIslamicMonth) {
  const days = [];
  let current = new Date(startOfIslamicMonth);
  let parts = getIslamicDateParts(current);
  const targetMonth = parts.month;

  // Add days until the month changes (usually 29 or 30 days)
  for (let i = 0; i < 35; i++) {
    let p = getIslamicDateParts(current);
    if (p.month !== targetMonth) break;
    days.push({
      date: current,
      dayNumber: p.day,
      isCurrentMonth: true
    });
    current = addDays(current, 1);
  }
  return { days, monthName: targetMonth, year: parts.year };
}

export default function FullCalendarWidget() {
  const [viewMode, setViewMode] = useState('gregorian'); // 'gregorian' or 'islamic'
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  // ── Gregorian Calendar Logic ──
  const nextMonthGregorian = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonthGregorian = () => setCurrentDate(subMonths(currentDate, 1));

  const gregorianDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate }).map(date => ({
      date,
      dayNumber: format(date, 'd'),
      isCurrentMonth: isSameMonth(date, monthStart)
    }));
  }, [currentDate]);

  // ── Islamic Calendar Logic ──
  const nextMonthIslamic = () => {
    // Jump forward by about 29 days to land in the next Islamic month
    setCurrentDate(addDays(currentDate, 29));
  };
  const prevMonthIslamic = () => {
    // Jump backward by about 30 days
    setCurrentDate(subDays(currentDate, 30));
  };

  const islamicData = useMemo(() => {
    const startOfIslamic = getStartOfIslamicMonth(currentDate);
    const { days, monthName, year } = getIslamicMonthDays(startOfIslamic);
    
    // We need to pad the beginning of the grid with empty days based on the weekday of Day 1
    const startWeekday = startOfIslamic.getDay(); // 0 = Sunday
    const paddedDays = [];
    
    // Pad previous month days (empty for simplicity in Islamic view, or calculate them)
    for (let i = 0; i < startWeekday; i++) {
      paddedDays.push({ date: subDays(startOfIslamic, startWeekday - i), dayNumber: '', isCurrentMonth: false });
    }
    
    paddedDays.push(...days);
    
    // Pad end
    const remaining = 42 - paddedDays.length; // 6 rows * 7 days
    let endCurrent = addDays(days[days.length - 1].date, 1);
    for (let i = 0; i < remaining; i++) {
      paddedDays.push({ date: endCurrent, dayNumber: '', isCurrentMonth: false });
      endCurrent = addDays(endCurrent, 1);
    }

    return { days: paddedDays, monthName, year };
  }, [currentDate]);

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const handleToggle = (mode) => {
    setViewMode(mode);
    setCurrentDate(new Date()); // Reset to today when switching modes
  };

  return (
    <div className="w-full bg-card border border-border rounded-3xl p-6 shadow-2xl flex flex-col h-full max-h-[600px]">
      
      {/* Header & Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-foreground">Calendar</h3>
        <div className="flex bg-secondary/50 p-1 rounded-full border border-border/50">
          <button
            onClick={() => handleToggle('gregorian')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              viewMode === 'gregorian' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
            Standard
          </button>
          <button
            onClick={() => handleToggle('islamic')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              viewMode === 'islamic' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Moon className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
            Islamic
          </button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6 px-2">
        <button 
          onClick={viewMode === 'gregorian' ? prevMonthGregorian : prevMonthIslamic}
          className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-black tracking-tight text-foreground">
          {viewMode === 'gregorian' 
            ? format(currentDate, 'MMMM yyyy') 
            : `${islamicData.monthName} ${islamicData.year} AH`}
        </h2>
        <button 
          onClick={viewMode === 'gregorian' ? nextMonthGregorian : nextMonthIslamic}
          className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1 flex-1">
        {(viewMode === 'gregorian' ? gregorianDays : islamicData.days).map((dayObj, i) => {
          const isToday = isSameDay(dayObj.date, today);
          
          return (
            <div key={i} className="aspect-square p-1">
              {dayObj.dayNumber && (
                <div 
                  className={`w-full h-full flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
                    isToday 
                      ? 'bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20' 
                      : dayObj.isCurrentMonth
                        ? 'text-foreground hover:bg-secondary/80'
                        : 'text-muted-foreground/30'
                  }`}
                >
                  {dayObj.dayNumber}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

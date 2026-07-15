import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from './storage';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = storage.get('namaz-theme');
    if (saved) return saved;
    return 'light'; // Default to light theme
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    storage.set('namaz-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeMode } from '../types';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('stockpilot_theme') as ThemeMode;
    return saved && ['light', 'dark', 'sage'].includes(saved) ? saved : 'light';
  });

  const applyTheme = (newTheme: ThemeMode) => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-sage');
    if (newTheme === 'dark') {
      root.classList.add('theme-dark');
    } else if (newTheme === 'sage') {
      root.classList.add('theme-sage');
    }
    localStorage.setItem('stockpilot_theme', newTheme);
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const sequence: ThemeMode[] = ['light', 'sage', 'dark'];
    const next = sequence[(sequence.indexOf(theme) + 1) % sequence.length];
    setTheme(next);
  };

  useEffect(() => {
    applyTheme(theme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Available themes
export type Theme = 'light' | 'dark' | 'blue' | 'purple' | 'green';

// Theme colors mapping
export const themeColors = {
  light: {
    background: '#ffffff',
    foreground: '#171717',
    primary: '#3b82f6',
    secondary: '#7dd3fc',
    accent: '#e879f9',
    board: '#f3f4f6'
  },
  dark: {
    background: '#0a0a0a',
    foreground: '#ededed',
    primary: '#3b82f6',
    secondary: '#38bdf8',
    accent: '#c084fc',
    board: '#1f2937'
  },
  blue: {
    background: '#0c4a6e',
    foreground: '#f0f9ff',
    primary: '#0ea5e9',
    secondary: '#7dd3fc',
    accent: '#2dd4bf',
    board: '#0c4a6e'
  },
  purple: {
    background: '#581c87',
    foreground: '#faf5ff',
    primary: '#a855f7',
    secondary: '#d8b4fe',
    accent: '#e879f9',
    board: '#4c1d95'
  },
  green: {
    background: '#064e3b',
    foreground: '#ecfdf5',
    primary: '#10b981',
    secondary: '#6ee7b7',
    accent: '#fcd34d',
    board: '#065f46'
  }
};

// Theme context type
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  applyTheme: (newTheme: Theme) => void;
}

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  applyTheme: () => {}
});

// Provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Get initial theme from localStorage or system preference
  const getInitialTheme = (): Theme => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedTheme = window.localStorage.getItem('theme') as Theme;
      if (savedTheme && Object.keys(themeColors).includes(savedTheme)) {
        return savedTheme;
      }
      
      // If no saved theme, check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    
    return 'light';
  };
  
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  
  // Apply theme by setting CSS variables
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    const colors = themeColors[newTheme];
    
    // Set CSS variables
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.foreground);
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--board', colors.board);
    
    // Update data-theme attribute
    document.body.dataset.theme = newTheme;
    
    // Save to localStorage
    localStorage.setItem('theme', newTheme);
    
    setTheme(newTheme);
  };
  
  // Initialize theme on mount
  useEffect(() => {
    applyTheme(theme);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
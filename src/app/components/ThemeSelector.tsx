'use client';

import React from 'react';
import { useTheme, Theme, themeColors } from '../context/ThemeContext';

export default function ThemeSelector() {
  const { theme, applyTheme } = useTheme();
  
  const themes: Theme[] = ['light', 'dark', 'blue', 'purple', 'green'];
  
  return (
    <div className="mb-6 w-full">
      <h2 className="text-lg font-semibold mb-3">Theme</h2>
      <div className="flex flex-wrap gap-2">
        {themes.map((themeName) => (
          <button
            key={themeName}
            onClick={() => applyTheme(themeName)}
            className={`
              w-10 h-10 rounded-full border-2
              ${theme === themeName ? 'border-blue-500 scale-110' : 'border-transparent'}
              transition-all hover:scale-105
            `}
            style={{
              backgroundColor: themeColors[themeName].background,
              boxShadow: theme === themeName ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none'
            }}
            aria-label={`${themeName} theme`}
            title={`${themeName} theme`}
          >
            <div
              className="w-3 h-3 mx-auto rounded-full"
              style={{ backgroundColor: themeColors[themeName].primary }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
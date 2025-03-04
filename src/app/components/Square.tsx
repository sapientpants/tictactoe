'use client';

import React from 'react';

interface SquareProps {
  value: string | null;
  onClick: () => void;
}

export default function Square({ value, onClick }: SquareProps) {
  // Use theme-based colors instead of hardcoded values
  const valueColor = value === 'X' ? 'text-primary' : 'text-accent';
  
  // CSS classes for animation when a value is placed
  const animationClass = value ? 'animate-appear' : '';
  
  return (
    <button 
      className={`w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-3xl sm:text-4xl font-bold flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${valueColor} ${animationClass}`}
      onClick={onClick}
    >
      {value}
    </button>
  );
}
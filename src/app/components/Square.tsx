'use client';

import React from 'react';

interface SquareProps {
  value: string | null;
  onClick: () => void;
}

export default function Square({ value, onClick }: SquareProps) {
  return (
    <button 
      className="w-20 h-20 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-4xl font-bold flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      onClick={onClick}
    >
      {value}
    </button>
  );
}
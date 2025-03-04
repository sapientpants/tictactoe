'use client';

import React from 'react';

interface GameStatusProps {
  status: string;
}

export default function GameStatus({ status }: GameStatusProps) {
  // Add styles based on status content
  const isWinner = status.includes('Winner');
  const isDraw = status.includes('Draw');
  
  let statusClass = 'text-xl font-medium mt-4 mb-6 text-center p-2 rounded-md';
  
  if (isWinner) {
    statusClass += ' bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 font-bold';
  } else if (isDraw) {
    statusClass += ' bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100';
  }
  
  return (
    <div className={statusClass}>
      {status}
    </div>
  );
}
'use client';

import React from 'react';

interface GameStatusProps {
  status: string;
}

export default function GameStatus({ status }: GameStatusProps) {
  return (
    <div className="text-xl font-medium mt-4 mb-6 text-center">
      {status}
    </div>
  );
}
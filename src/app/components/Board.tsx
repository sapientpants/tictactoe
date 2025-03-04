'use client';

import React from 'react';
import Square from './Square';

interface BoardProps {
  squares: (string | null)[];
  onClick: (i: number) => void;
}

export default function Board({ squares, onClick }: BoardProps) {
  const renderSquare = (i: number) => {
    return (
      <Square
        value={squares[i]}
        onClick={() => onClick(i)}
      />
    );
  };

  return (
    <div className="grid grid-cols-3 gap-1 max-w-fit mx-auto">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i}>
          {renderSquare(i)}
        </div>
      ))}
    </div>
  );
}
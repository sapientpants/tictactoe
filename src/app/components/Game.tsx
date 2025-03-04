'use client';

import React, { useState } from 'react';
import Board from './Board';
import GameStatus from './GameStatus';

export default function Game() {
  const [squares, setSquares] = useState<(string | null)[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  
  const handleClick = (i: number) => {
    const squaresCopy = [...squares];
    
    // Return early if square already filled or game won
    if (squaresCopy[i] || calculateWinner(squaresCopy)) return;
    
    squaresCopy[i] = xIsNext ? 'X' : 'O';
    setSquares(squaresCopy);
    setXIsNext(!xIsNext);
  };
  
  const resetGame = () => {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
  };
  
  const winner = calculateWinner(squares);
  let status: string;
  
  if (winner) {
    status = `Winner: ${winner}`;
  } else if (squares.every(square => square !== null)) {
    status = 'Draw!';
  } else {
    status = `Next player: ${xIsNext ? 'X' : 'O'}`;
  }
  
  return (
    <div className="flex flex-col items-center max-w-md mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Tic Tac Toe</h1>
      
      <Board squares={squares} onClick={handleClick} />
      <GameStatus status={status} />
      
      <button 
        onClick={resetGame}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Restart Game
      </button>
    </div>
  );
}

// Helper function to calculate winner
function calculateWinner(squares: (string | null)[]): string | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  
  return null;
}
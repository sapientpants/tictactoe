'use client';

import React, { useEffect, useState } from 'react';
import { OnlineGameState } from '../hooks/useSocket';
import { calculateWinner } from '../utils/gameUtils';
import Square from './Square';

interface OnlineBoardProps {
  gameState: OnlineGameState;
  onSquareClick: (index: number) => void;
  onRequestRestart?: () => void;
}

export default function OnlineBoard({ gameState, onSquareClick, onRequestRestart }: OnlineBoardProps) {
  const [winner, setWinner] = useState<string | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  
  // Reset local game state when gameState changes (including on restart)
  useEffect(() => {
    console.log('Game state updated in OnlineBoard, squares:', gameState.squares);
    
    // Reset local state when gameState changes
    const result = calculateWinnerWithLine(gameState.squares);
    
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
    } else if (gameState.squares.every(square => square !== null)) {
      setIsDraw(true);
    } else {
      setWinner(null);
      setWinningLine(null);
      setIsDraw(false);
    }
  }, [gameState]);
  
  // Handle square click
  const handleClick = (i: number) => {
    if (
      // Square already filled
      gameState.squares[i] ||
      // Game already won
      winner ||
      // Game is a draw
      isDraw ||
      // Not player's turn
      gameState.currentTurn !== gameState.role ||
      // Opponent not connected
      !gameState.opponentConnected
    ) {
      return;
    }
    
    onSquareClick(i);
  };
  
  // Request to restart the game
  const handleRestartRequest = (e: React.MouseEvent) => {
    // Prevent default to ensure the event is captured
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Play Again button clicked, calling onRequestRestart');
    
    // Check if the restart function is available
    if (onRequestRestart) {
      onRequestRestart();
    } else {
      console.error('onRequestRestart function is not provided');
    }
  };
  
  // Render a square with the right styling
  const renderSquare = (i: number) => {
    const isWinningSquare = winningLine?.includes(i);
    
    return (
      <div 
        key={i}
        className={`
          ${isWinningSquare ? 'animate-victory' : ''}
        `}
      >
        <Square
          value={gameState.squares[i]}
          onClick={() => handleClick(i)}
        />
      </div>
    );
  };
  
  // Get the player's role
  const playerRole = gameState.role || 'X';
  
  // Debug
  console.log('Player role:', playerRole);
  
  // Render game result message with restart button
  const renderGameResult = () => {
    if (winner || isDraw) {
      const isUserWinner = winner === gameState.role;
      const resultStyle = winner 
        ? (isUserWinner 
            ? 'bg-green-100 dark:bg-green-900 dark:bg-opacity-20 text-green-800 dark:text-green-200' 
            : 'bg-red-100 dark:bg-red-900 dark:bg-opacity-20 text-red-800 dark:text-red-200')
        : 'bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-20 text-yellow-800 dark:text-yellow-200';
      
      return (
        <div className={`mt-4 p-4 rounded-md text-center ${resultStyle}`}>
          <p className="font-bold mb-3">
            {winner 
              ? (isUserWinner ? 'You won!' : 'You lost!') 
              : 'Game ended in a draw!'}
          </p>
          
          <button 
            onClick={handleRestartRequest}
            className="px-4 py-2 rounded-md transition-colors bg-primary text-white hover:bg-opacity-90 font-bold"
            data-testid="play-again-button"
          >
            Play Again
          </button>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="responsive-board">
      <div className="grid grid-cols-3 gap-1 max-w-fit mx-auto bg-board dark:bg-gray-800 p-3 rounded-lg shadow-md">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => renderSquare(i))}
      </div>
      
      {renderGameResult()}
    </div>
  );
}

// Helper function to get both winner and winning line
function calculateWinnerWithLine(squares: (string | null)[]): { winner: string; line: number[] } | null {
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
      return {
        winner: squares[a]!,
        line: lines[i],
      };
    }
  }
  
  return null;
}
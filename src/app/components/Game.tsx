'use client';

import React, { useState, useEffect } from 'react';
import Board from './Board';
import GameStatus from './GameStatus';
import { calculateWinner } from '../utils/gameUtils';

interface GameHistory {
  squares: (string | null)[];
  player: string;
  position: number;
}

export default function Game() {
  const [squares, setSquares] = useState<(string | null)[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [scores, setScores] = useState<{ X: number; O: number; draws: number }>({ X: 0, O: 0, draws: 0 });
  const [playerNames, setPlayerNames] = useState<{ X: string; O: string }>({ X: 'Player X', O: 'Player O' });
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [lastMove, setLastMove] = useState<number | null>(null);
  
  const handleClick = (i: number) => {
    const squaresCopy = [...squares];
    
    // Return early if square already filled or game won
    if (squaresCopy[i] || calculateWinner(squaresCopy) || gameComplete) return;
    
    const currentPlayer = xIsNext ? 'X' : 'O';
    squaresCopy[i] = currentPlayer;
    
    // Add move to history
    const newHistoryEntry: GameHistory = {
      squares: [...squaresCopy],
      player: currentPlayer,
      position: i
    };
    
    setSquares(squaresCopy);
    setXIsNext(!xIsNext);
    setHistory([...history, newHistoryEntry]);
    setLastMove(i);
  };
  
  // Check for winner or draw and update scores
  useEffect(() => {
    const winner = calculateWinner(squares);
    const isDraw = !winner && squares.every(square => square !== null);
    
    if (winner || isDraw) {
      setGameComplete(true);
      
      // Update scores
      if (winner) {
        setScores(prev => ({
          ...prev,
          [winner]: prev[winner as keyof typeof prev] + 1
        }));
      } else if (isDraw) {
        setScores(prev => ({
          ...prev,
          draws: prev.draws + 1
        }));
      }
    }
  }, [squares]);
  
  const resetGame = () => {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setGameComplete(false);
    setLastMove(null);
    // Keep the history for reference
  };
  
  const startNewMatch = () => {
    resetGame();
    setHistory([]);
  };
  
  const updatePlayerName = (player: 'X' | 'O', name: string) => {
    setPlayerNames(prev => ({
      ...prev,
      [player]: name
    }));
  };
  
  const winner = calculateWinner(squares);
  let status: string;
  
  if (winner) {
    status = `Winner: ${playerNames[winner as keyof typeof playerNames]}`;
  } else if (squares.every(square => square !== null)) {
    status = 'Draw!';
  } else {
    status = `Next player: ${playerNames[xIsNext ? 'X' : 'O']}`;
  }
  
  return (
    <div className="flex flex-col items-center max-w-md mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Tic Tac Toe</h1>
      
      {/* Player Name Inputs */}
      <div className="grid grid-cols-2 gap-4 mb-6 w-full">
        <div>
          <label htmlFor="player-x" className="block text-sm font-medium mb-1">Player X</label>
          <input
            id="player-x"
            type="text"
            value={playerNames.X}
            onChange={(e) => updatePlayerName('X', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label htmlFor="player-o" className="block text-sm font-medium mb-1">Player O</label>
          <input
            id="player-o"
            type="text"
            value={playerNames.O}
            onChange={(e) => updatePlayerName('O', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>
      
      {/* Scoreboard */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6 w-full">
        <h2 className="text-lg font-semibold mb-2 text-center">Scoreboard</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-medium">{playerNames.X}</p>
            <p className="text-xl font-bold">{scores.X}</p>
          </div>
          <div>
            <p className="font-medium">Draws</p>
            <p className="text-xl font-bold">{scores.draws}</p>
          </div>
          <div>
            <p className="font-medium">{playerNames.O}</p>
            <p className="text-xl font-bold">{scores.O}</p>
          </div>
        </div>
      </div>
      
      {/* Game Board with Animation */}
      <div className={`relative ${lastMove !== null ? 'animate-pulse' : ''}`}>
        <Board squares={squares} onClick={handleClick} />
      </div>
      
      <GameStatus status={status} />
      
      <div className="flex flex-wrap gap-4 mt-4">
        <button 
          onClick={resetGame}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          New Game
        </button>
        
        <button 
          onClick={startNewMatch}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Reset Scores
        </button>
        
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          {showHistory ? 'Hide History' : 'Show History'}
        </button>
      </div>
      
      {/* Game History */}
      {showHistory && (
        <div className="mt-6 w-full">
          <h2 className="text-lg font-semibold mb-2">Game History</h2>
          {history.length === 0 ? (
            <p className="text-gray-500 italic">No moves yet</p>
          ) : (
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {history.map((step, move) => (
                <li key={move} className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  Move #{move + 1}: {step.player} placed at position {step.position + 1}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
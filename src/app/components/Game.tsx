'use client';

import React, { useState, useEffect } from 'react';
import Board from './Board';
import GameStatus from './GameStatus';
import ThemeSelector from './ThemeSelector';
import GameModeSelector from './GameModeSelector';
import { calculateWinner, getAIMove, AIDifficulty } from '../utils/gameUtils';
import { ThemeProvider } from '../context/ThemeContext';

interface GameHistory {
  squares: (string | null)[];
  player: string;
  position: number;
}

export default function Game() {
  // Game state
  const [squares, setSquares] = useState<(string | null)[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [scores, setScores] = useState<{ X: number; O: number; draws: number }>({ X: 0, O: 0, draws: 0 });
  const [playerNames, setPlayerNames] = useState<{ X: string; O: string }>({ X: 'You', O: `AI (${AIDifficulty.MEDIUM})` });
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [lastMove, setLastMove] = useState<number | null>(null);
  
  // Game mode settings - make AI the default mode
  const [gameMode, setGameMode] = useState<'local' | 'ai'>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>(AIDifficulty.MEDIUM);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // AI turn
  useEffect(() => {
    // Only make AI move when it's O's turn (AI is always O), game is in AI mode, and game is not complete
    if (gameMode === 'ai' && !xIsNext && !gameComplete) {
      // Add a small delay to make the AI's move seem more natural
      const timerId = setTimeout(() => {
        const aiMoveIndex = getAIMove(squares, aiDifficulty, 'O');
        
        if (aiMoveIndex !== -1) {
          handleMove(aiMoveIndex);
        }
      }, 500);
      
      return () => clearTimeout(timerId);
    }
  }, [xIsNext, gameMode, gameComplete, aiDifficulty, squares]);
  
  const handleMove = (i: number) => {
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
  
  const handleClick = (i: number) => {
    // Prevent player from making a move when it's AI's turn
    if (gameMode === 'ai' && !xIsNext) return;
    
    handleMove(i);
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
  
  // Handle game mode change
  const handleGameModeChange = (mode: 'local' | 'ai') => {
    setGameMode(mode);
    resetGame();
    
    // If switching to AI mode, update player names
    if (mode === 'ai') {
      setPlayerNames({ X: 'You', O: `AI (${aiDifficulty})` });
    } else {
      setPlayerNames({ X: 'Player X', O: 'Player O' });
    }
  };
  
  // Handle AI difficulty change
  const handleAIDifficultyChange = (difficulty: AIDifficulty) => {
    setAiDifficulty(difficulty);
    if (gameMode === 'ai') {
      setPlayerNames(prev => ({ ...prev, O: `AI (${difficulty})` }));
    }
    resetGame();
  };
  
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
  
  const resetScores = () => {
    setScores({ X: 0, O: 0, draws: 0 });
    startNewMatch();
  };
  
  const updatePlayerName = (player: 'X' | 'O', name: string) => {
    // Only allow updating player names in local mode
    // or player X in AI mode
    if (gameMode === 'local' || (gameMode === 'ai' && player === 'X')) {
      setPlayerNames(prev => ({
        ...prev,
        [player]: name
      }));
    }
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
    <ThemeProvider>
      <div className="flex flex-col items-center max-w-lg mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Tic Tac Toe vs AI</h1>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="mb-6 px-4 py-2 bg-accent text-white rounded-full hover:bg-opacity-90 transition-colors"
        >
          {showSettings ? 'Hide Settings' : 'Game Settings'}
        </button>
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="w-full bg-board dark:bg-gray-800 rounded-lg p-4 mb-6 shadow-md">
            <GameModeSelector
              gameMode={gameMode}
              aiDifficulty={aiDifficulty}
              onGameModeChange={handleGameModeChange}
              onAIDifficultyChange={handleAIDifficultyChange}
            />
            
            <ThemeSelector />
            
            {/* Player Name Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 w-full">
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
                  disabled={gameMode === 'ai'}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 ${
                    gameMode === 'ai' ? 'opacity-60 cursor-not-allowed' : 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Scoreboard */}
        <div className="bg-board dark:bg-gray-800 rounded-lg p-4 mb-6 w-full shadow-md">
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
        
        {/* Game Board with Animation - Added responsive classes */}
        <div className={`relative responsive-board ${lastMove !== null ? 'animate-pulse' : ''}`}>
          <Board squares={squares} onClick={handleClick} />
        </div>
        
        <GameStatus status={status} />
        
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <button 
            onClick={resetGame}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition-colors"
          >
            New Game
          </button>
          
          <button 
            onClick={resetScores}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-opacity-90 transition-colors"
          >
            Reset Scores
          </button>
          
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-secondary text-white rounded hover:bg-opacity-90 transition-colors"
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
              <ul className="space-y-2 max-h-40 overflow-y-auto bg-board dark:bg-gray-800 p-3 rounded-md">
                {history.map((step, move) => (
                  <li key={move} className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    Move #{move + 1}: {step.player} ({playerNames[step.player as keyof typeof playerNames]}) placed at position {step.position + 1}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}
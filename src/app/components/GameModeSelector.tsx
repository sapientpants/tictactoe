'use client';

import React from 'react';
import { AIDifficulty } from '../utils/gameUtils';

interface GameModeSelectorProps {
  gameMode: 'local' | 'ai';
  aiDifficulty: AIDifficulty;
  onGameModeChange: (mode: 'local' | 'ai') => void;
  onAIDifficultyChange: (difficulty: AIDifficulty) => void;
}

export default function GameModeSelector({
  gameMode,
  aiDifficulty,
  onGameModeChange,
  onAIDifficultyChange
}: GameModeSelectorProps) {
  return (
    <div className="mb-6 w-full">
      <h2 className="text-lg font-semibold mb-3">Game Mode</h2>
      
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => onGameModeChange('local')}
          className={`px-4 py-2 rounded-md transition-all ${
            gameMode === 'local'
              ? 'bg-primary text-white font-medium'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Local Multiplayer
        </button>
        
        <button
          onClick={() => onGameModeChange('ai')}
          className={`px-4 py-2 rounded-md transition-all ${
            gameMode === 'ai'
              ? 'bg-primary text-white font-medium'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Play vs AI
        </button>
      </div>
      
      {gameMode === 'ai' && (
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
          <h3 className="text-base font-medium mb-2">AI Difficulty</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.values(AIDifficulty).map((difficulty) => (
              <button
                key={difficulty}
                onClick={() => onAIDifficultyChange(difficulty)}
                className={`px-3 py-1.5 rounded-md text-sm capitalize transition-all ${
                  aiDifficulty === difficulty
                    ? 'bg-accent text-white font-medium'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {difficulty}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
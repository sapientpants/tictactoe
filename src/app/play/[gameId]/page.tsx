'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import useSocket from '../../../hooks/useSocket';
import { ThemeProvider } from '../../../context/ThemeContext';
import OnlineBoard from '../../../components/OnlineBoard';

export default function GamePage({ params }: { params: { gameId: string } }) {
  const { gameId } = params;
  const { gameState, error, isLoading, makeMove } = useSocket(gameId);
  const [copied, setCopied] = useState(false);

  // Function to copy the invite link
  const copyInviteLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="flex flex-col items-center max-w-lg mx-auto p-6">
          <h1 className="text-3xl font-bold mb-8">Connecting to Game</h1>
          <div className="w-full bg-board dark:bg-gray-800 rounded-lg p-6 shadow-md flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p>Connecting to the game...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider>
        <div className="flex flex-col items-center max-w-lg mx-auto p-6">
          <h1 className="text-3xl font-bold mb-8">Error</h1>
          <div className="w-full bg-board dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="text-red-500 p-4 rounded-md bg-red-100 dark:bg-red-900 dark:bg-opacity-20">
              <h3 className="font-bold">Unable to Join Game</h3>
              <p>{error}</p>
              <div className="mt-4">
                <Link
                  href="/play"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
                >
                  Back to Play Menu
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!gameState) {
    return (
      <ThemeProvider>
        <div className="flex flex-col items-center max-w-lg mx-auto p-6">
          <h1 className="text-3xl font-bold mb-8">Game Not Found</h1>
          <div className="w-full bg-board dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <p className="mb-4">The game you're looking for doesn't exist or has expired.</p>
            <Link
              href="/play"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
            >
              Back to Play Menu
            </Link>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="flex flex-col items-center max-w-lg mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Online Tic Tac Toe</h1>
        
        {gameState.role === 'X' && !gameState.opponentConnected && (
          <div className="w-full bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <h2 className="font-bold text-lg text-yellow-800 dark:text-yellow-200 mb-2">Waiting for opponent</h2>
            <p className="mb-3 text-yellow-700 dark:text-yellow-300">Share this link with a friend to play:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={window.location.href}
                readOnly
                className="flex-grow px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 text-sm"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={copyInviteLink}
                className="px-3 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors text-sm whitespace-nowrap"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        )}
        
        {gameState.role === 'O' && (
          <div className="w-full bg-green-50 dark:bg-green-900 dark:bg-opacity-20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <p className="text-green-700 dark:text-green-300">
              You've joined the game as Player O!
            </p>
          </div>
        )}
        
        <div className="w-full mb-6">
          <div className="bg-board dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <h2 className="text-lg font-semibold mb-2 text-center">Game Status</h2>
            <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded text-center">
              {gameState.role === 'X' ? (
                <p>You are playing as <span className="text-primary font-bold">X</span></p>
              ) : (
                <p>You are playing as <span className="text-accent font-bold">O</span></p>
              )}
              
              {!gameState.opponentConnected && (
                <p className="text-yellow-500 dark:text-yellow-300 mt-2">
                  Waiting for opponent to connect...
                </p>
              )}
              
              {gameState.opponentConnected && (
                <p className="mt-2">
                  {gameState.currentTurn === gameState.role 
                    ? <span className="text-green-500 dark:text-green-300 font-semibold">Your turn</span>
                    : <span className="text-gray-500 dark:text-gray-400">Opponent's turn</span>
                  }
                </p>
              )}
            </div>
          </div>
        </div>
        
        <OnlineBoard 
          gameState={gameState}
          onSquareClick={makeMove}
        />
        
        <div className="mt-6 flex gap-4">
          <Link
            href="/play"
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-opacity-90 transition-colors"
          >
            Exit Game
          </Link>
        </div>
      </div>
    </ThemeProvider>
  );
}
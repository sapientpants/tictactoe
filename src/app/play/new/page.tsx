'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSocket from '../../hooks/useSocket';
import { ThemeProvider } from '../../context/ThemeContext';
import OnlineBoard from '../../components/OnlineBoard';

export default function NewGamePage() {
  const router = useRouter();
  const { gameState, error, isLoading, isConnected, createGame } = useSocket();
  const [copied, setCopied] = useState(false);

  // Create a new game when the component mounts and socket is connected
  useEffect(() => {
    if (isConnected) {
      console.log("Socket connected, creating game...");
      createGame();
    }
  }, [isConnected, createGame]);

  // Redirect to the game when it's created
  useEffect(() => {
    if (gameState?.id) {
      router.push(`/play/${gameState.id}`);
    }
  }, [gameState, router]);

  return (
    <ThemeProvider>
      <div className="flex flex-col items-center max-w-lg mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Creating New Game</h1>

        <div className="w-full bg-board dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-md">
          {isLoading ? (
            <div className="flex flex-col items-center p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p>Creating a new game...</p>
            </div>
          ) : error ? (
            <div className="text-red-500 p-4 rounded-md bg-red-100 dark:bg-red-900 dark:bg-opacity-20">
              <h3 className="font-bold">Error</h3>
              <p>{error}</p>
              <div className="mt-4">
                <Link
                  href="/play"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
                >
                  Go Back
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center p-6">
              <p>Redirecting to your game room...</p>
            </div>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}
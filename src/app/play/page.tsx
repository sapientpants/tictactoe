'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeProvider } from '../context/ThemeContext';
import ThemeSelector from '../components/ThemeSelector';
import { io } from 'socket.io-client';
import { resetSocketInstance } from '../hooks/useSocket';

// Helper function to clean up any existing socket connections
function cleanupSockets() {
  // Try to disconnect any existing sockets
  try {
    // Reset the global socket instance reference
    resetSocketInstance();
    
    // Get all possible socket.io connection keys from localStorage
    const storageKeys = Object.keys(localStorage);
    const socketKeys = storageKeys.filter(key => key.startsWith('socket.io'));
    
    if (socketKeys.length > 0) {
      console.log("Cleaning up socket.io storage keys:", socketKeys);
      socketKeys.forEach(key => localStorage.removeItem(key));
    }
    
    // Create a temporary socket just to disconnect it properly
    const tempSocket = io();
    if (tempSocket) {
      console.log("Disconnecting any existing socket connections");
      tempSocket.disconnect();
    }
  } catch (e) {
    console.error("Error cleaning up sockets:", e);
  }
}

export default function PlayPage() {
  // Router not used currently but kept for future navigation needs
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  
  // Clean up any previous socket connections when mounting this component
  useEffect(() => {
    console.log("Play menu mounted, cleaning up previous games");
    cleanupSockets();
    
    // Clear any game-related data from session/local storage if you have any
    try {
      // Example: Clear any game state you might be storing
      sessionStorage.removeItem('ticTacToeGameState');
      // Add other cleanup as needed
    } catch (e) {
      console.error("Error cleaning storage:", e);
    }
  }, []);

  return (
    <ThemeProvider>
      <div className="flex flex-col items-center max-w-lg mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Tic Tac Toe Online</h1>

        <div className="w-full bg-board dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-md">
          <h2 className="text-xl font-bold mb-4">Play Online</h2>
          <p className="mb-6">
            Play Tic Tac Toe with friends from anywhere! Create a new game and share the link with a friend, or join a game using a link that was shared with you.
          </p>

          <div className="flex flex-col gap-4">
            <Link
              href="/play/new"
              className="w-full py-3 bg-primary text-white font-medium rounded-md text-center hover:bg-opacity-90 transition-colors"
            >
              Create New Game
            </Link>

            <Link
              href="/"
              className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-medium rounded-md text-center hover:bg-opacity-90 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>

        <div className="w-full">
          <ThemeSelector />
        </div>
      </div>
    </ThemeProvider>
  );
}
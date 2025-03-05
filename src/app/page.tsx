'use client';

import Link from 'next/link';
import Game from './components/Game';
import { useEffect } from 'react';
import { io } from 'socket.io-client';

// Helper function to disconnect any active sockets
function cleanupGameConnections() {
  console.log("Cleaning up any active game connections");
  try {
    // Try to disconnect any existing sockets
    const tempSocket = io();
    if (tempSocket) {
      console.log("Disconnecting any existing socket connections");
      tempSocket.disconnect();
    }
    
    // Clear socket.io related storage
    const storageKeys = Object.keys(localStorage);
    const socketKeys = storageKeys.filter(key => key.startsWith('socket.io'));
    if (socketKeys.length > 0) {
      console.log("Removing socket.io storage keys:", socketKeys);
      socketKeys.forEach(key => localStorage.removeItem(key));
    }
    
    // Clear any session storage
    sessionStorage.removeItem('ticTacToeGameState');
    
  } catch (e) {
    console.error("Error during cleanup:", e);
  }
}

export default function Home() {
  // Clean up any active game connections when home page mounts
  useEffect(() => {
    console.log("Home page mounted");
    cleanupGameConnections();
  }, []);
  
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center">
        <h1 className="text-4xl font-bold">Tic Tac Toe vs AI</h1>
        
        <div className="flex gap-4 mb-6">
          <Link 
            href="/play" 
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
            onClick={() => {
              // Ensure we clean up before navigating
              cleanupGameConnections();
            }}
          >
            Play Online
          </Link>
        </div>
        
        <Game />
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-sm">
        <p>A simple TicTacToe game built with Next.js</p>
      </footer>
    </div>
  );
}

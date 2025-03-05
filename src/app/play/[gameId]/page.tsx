'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import useSocket from '../../hooks/useSocket';
import { ThemeProvider } from '../../context/ThemeContext';
import OnlineBoard from '../../components/OnlineBoard';
import { useRouter } from 'next/navigation';

// Define the component with proper Next.js App Router types
export default function GamePage({ 
  params 
}: { 
  params: { gameId: string } 
}) {
  // Access gameId directly from params
  const gameId = params.gameId;
  
  const router = useRouter();
  const { gameState, error, isLoading, isConnected, makeMove, requestRestart, socket, disconnectSocket } = useSocket(gameId);
  
  // For debugging
  console.log("GameId page mounted with requestRestart function available:", !!requestRestart);
  const [copied, setCopied] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  // Retry connection if needed
  useEffect(() => {
    if (!isConnected && !isLoading && connectionAttempts < 3) {
      const timer = setTimeout(() => {
        console.log(`Retrying connection (attempt ${connectionAttempts + 1})...`);
        setConnectionAttempts(prev => prev + 1);
        // Force a reload of the component to retry connection
        router.refresh();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, isLoading, connectionAttempts, router]);

  // Function to copy the invite link
  const copyInviteLink = () => {
    try {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      console.log("Link copied to clipboard:", url);
    } catch (e) {
      console.error("Error copying link:", e);
      alert("Could not copy link. Please copy it manually.");
    }
  };
  
  // Handle manual reload attempt
  const handleRetryConnection = () => {
    console.log("Manual retry connection");
    setConnectionAttempts(0);
    router.refresh();
  };

  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="flex flex-col items-center max-w-lg mx-auto p-6">
          <h1 className="text-3xl font-bold mb-8 text-center">Connecting to Game</h1>
          
          <div className="w-full bg-board dark:bg-gray-800 rounded-lg p-6 shadow-md flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p>Connecting to the game...</p>
            {connectionAttempts > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Connection attempt {connectionAttempts + 1}/4
              </p>
            )}
          </div>
          
          <div className="mt-6">
            <Link
              href="/play"
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
            >
              Back to Menu
            </Link>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Show connection error after several attempts
  if (!isConnected && connectionAttempts >= 3) {
    return (
      <ThemeProvider>
        <div className="flex flex-col items-center max-w-lg mx-auto p-6">
          <h1 className="text-3xl font-bold mb-8 text-center">Connection Error</h1>
          
          <div className="w-full bg-board dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="text-red-500 p-4 rounded-md bg-red-100 dark:bg-red-900 dark:bg-opacity-20">
              <h3 className="font-bold">Unable to Connect to Game Server</h3>
              <p>Could not establish a connection to the game server after multiple attempts.</p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleRetryConnection}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
                >
                  Try Again
                </button>
                <Link
                  href="/play"
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
                >
                  Back to Menu
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Show specific error from socket
  if (error) {
    return (
      <ThemeProvider>
        <div className="flex flex-col items-center max-w-lg mx-auto p-6">
          <h1 className="text-3xl font-bold mb-8 text-center">Game Error</h1>
          
          <div className="w-full bg-board dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="text-red-500 p-4 rounded-md bg-red-100 dark:bg-red-900 dark:bg-opacity-20">
              <h3 className="font-bold">Unable to Join Game</h3>
              <p>{error}</p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleRetryConnection}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
                >
                  Try Again
                </button>
                <Link
                  href="/play"
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
                >
                  Back to Menu
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Game not found or not initialized yet
  if (!gameState) {
    return (
      <ThemeProvider>
        <div className="flex flex-col items-center max-w-lg mx-auto p-6">
          <h1 className="text-3xl font-bold mb-8 text-center">Game Not Found</h1>
          
          <div className="w-full bg-board dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <p className="mb-4">The game you&apos;re looking for doesn&apos;t exist or has expired.</p>
            <div className="flex gap-3">
              <button
                onClick={handleRetryConnection}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/play"
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
              >
                Back to Menu
              </Link>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Game is ready to render
  
  return (
    <ThemeProvider>
      <div className="flex flex-col items-center max-w-lg mx-auto p-6">
        <div className="w-full mb-4">
          <h1 className="text-3xl font-bold text-center">
            Online Tic Tac Toe
          </h1>
        </div>
        
        {!gameState.opponentConnected && (
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
        
        {gameState.opponentConnected && (
          <div className="w-full bg-green-50 dark:bg-green-900 dark:bg-opacity-20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <p className="text-green-700 dark:text-green-300">
              {gameState.role === 'X' 
                ? "Player O has joined the game!" 
                : "You've joined the game as Player O!"}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Game is ready to play! {gameState.currentTurn === 'X' ? "X" : "O"} goes first.
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
                    : <span className="text-gray-500 dark:text-gray-400">Opponent&apos;s turn</span>
                  }
                </p>
              )}
            </div>
          </div>
        </div>
        
        <OnlineBoard 
          gameState={gameState}
          onSquareClick={makeMove}
          onRequestRestart={() => {
            console.log("Rematch requested, gameId:", gameId);
            
            if (!requestRestart) {
              console.error("requestRestart function is not available!");
              return;
            }
            
            // Try/catch to catch any possible errors
            try {
              requestRestart();
              console.log("Rematch request sent successfully");
            } catch (error) {
              console.error("Error requesting rematch:", error);
            }
          }}
        />
        
        {/* Exit Game button - identical for both players */}
        <div className="mt-8 mb-6 flex justify-center">
          <Link
            href="/play"
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-bold text-lg shadow-md"
            onClick={() => {
              // First inform the server we're leaving (if still connected)
              if (socket && socket.connected && gameState) {
                try {
                  console.log("Sending leaveGame event for gameId:", gameState.id);
                  socket.emit('leaveGame', { gameId: gameState.id });
                } catch (e) {
                  console.error("Error sending leaveGame event:", e);
                }
              }
              
              // Disconnect socket to clear all state when exiting
              // Small delay to ensure leaveGame is processed first
              setTimeout(() => {
                console.log("Disconnecting socket and resetting state");
                disconnectSocket();
                console.log("Socket disconnected and reference cleared");
              }, 100);
              
              // Clear any local storage or other state if needed
              console.log("Cleaning up game state on exit");
            }}
          >
            EXIT GAME
          </Link>
        </div>
      </div>
    </ThemeProvider>
  );
}
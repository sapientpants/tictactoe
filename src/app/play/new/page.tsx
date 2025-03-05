'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSocket from '../../hooks/useSocket';
import { ThemeProvider } from '../../context/ThemeContext';

export default function NewGamePage() {
  const router = useRouter();
  const { gameState, error, isLoading, isConnected, createGame } = useSocket();
  const [creationAttempt, setCreationAttempt] = useState(0);
  const [creatingGame, setCreatingGame] = useState(false);
  
  // Initialize socket and create new game when connected
  useEffect(() => {
    if (isConnected && !creatingGame && creationAttempt === 0) {
      console.log("Socket connected, creating game...");
      setCreatingGame(true);
      
      try {
        createGame();
        console.log("Game creation request sent");
        // Set a retry timer in case the server doesn't respond
        const timer = setTimeout(() => {
          console.log("Game creation timed out, incrementing attempt counter");
          setCreationAttempt(prev => prev + 1);
          setCreatingGame(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      } catch (error) {
        console.error("Error creating game:", error);
        setCreatingGame(false);
      }
    }
  }, [isConnected, createGame, creationAttempt, creatingGame]);
  
  // Retry game creation if needed
  useEffect(() => {
    if (creationAttempt > 0 && creationAttempt <= 3 && !creatingGame && isConnected) {
      console.log(`Retry attempt ${creationAttempt}...`);
      setCreatingGame(true);
      
      try {
        createGame();
        // Set another retry timer
        const timer = setTimeout(() => {
          setCreationAttempt(prev => prev + 1);
          setCreatingGame(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      } catch (error) {
        console.error("Error during retry:", error);
        setCreatingGame(false);
      }
    }
  }, [creationAttempt, createGame, creatingGame, isConnected]);

  // Redirect to the game when it's created
  useEffect(() => {
    if (gameState?.id) {
      console.log("Game created successfully, redirecting to:", gameState.id);
      router.push(`/play/${gameState.id}`);
    }
  }, [gameState, router]);

  // Handle manual retry
  const handleRetry = () => {
    setCreationAttempt(0);
    setCreatingGame(false);
  };

  // Determine if we should show an error due to multiple failed attempts
  const showError = creationAttempt > 3 || error;
  const errorMessage = error || "Unable to create a game after multiple attempts. Please try again.";

  return (
    <ThemeProvider>
      <div className="flex flex-col items-center max-w-lg mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Creating New Game</h1>

        <div className="w-full bg-board dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-md">
          {isLoading || creatingGame ? (
            <div className="flex flex-col items-center p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p>{creationAttempt > 0 ? `Creating game (attempt ${creationAttempt}/3)...` : "Creating a new game..."}</p>
              <p className="text-sm text-gray-500 mt-2">
                {isConnected ? "Connected to server" : "Connecting to server..."}
              </p>
              {creationAttempt > 0 && (
                <button 
                  onClick={handleRetry}
                  className="mt-4 px-3 py-1 bg-primary text-white text-sm rounded hover:bg-opacity-90 transition-colors"
                >
                  Retry Now
                </button>
              )}
            </div>
          ) : showError ? (
            <div className="text-red-500 p-4 rounded-md bg-red-100 dark:bg-red-900 dark:bg-opacity-20">
              <h3 className="font-bold">Error Creating Game</h3>
              <p>{errorMessage}</p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
                >
                  Try Again
                </button>
                <Link
                  href="/play"
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-opacity-90 transition-colors"
                >
                  Go Back
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center p-6">
              <div className="animate-pulse">
                <p>Setting up your game room...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}
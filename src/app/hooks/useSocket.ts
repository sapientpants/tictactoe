'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export type GameRole = 'X' | 'O' | 'spectator';

export interface OnlineGameState {
  id: string;
  squares: (string | null)[];
  players: {
    X: string | null;
    O: string | null;
  };
  currentTurn: 'X' | 'O';
  role?: GameRole;
  shareUrl?: string;
  opponentConnected?: boolean;
  createdAt: number;
  lastUpdated?: number;
  restartRequested?: {
    X?: boolean;
    O?: boolean;
  };
}

// Create a single socket instance to be reused across the app
let socketInstance: Socket | null = null;

export default function useSocket(gameId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<OnlineGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  
  // Initialize socket connection or reuse existing connection
  useEffect(() => {
    const connectToSocket = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // If we already have a socket instance, use it
        if (socketInstance && socketInstance.connected) {
          console.log('Reusing existing socket connection');
          setSocket(socketInstance);
          setIsConnected(true);
          
          if (gameId) {
            console.log('Joining game with existing socket:', gameId);
            socketInstance.emit('joinGame', { gameId });
          }
          
          setupSocketListeners(socketInstance);
          setIsLoading(false);
          return;
        }
        
        // Check server status first
        if (!initializing) {
          setInitializing(true);
          console.log('Checking socket.io server status...');
          
          try {
            const response = await fetch('/api/socket');
            const data = await response.json();
            console.log('Socket server status:', data.status);
          } catch (err) {
            console.warn('Socket status check failed, will try direct connection:', err);
          }
        }
        
        // Create new socket connection
        console.log('Creating new socket connection...');
        const newSocket = io({
          transports: ['polling', 'websocket'],
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          timeout: 20000
        });
        
        socketInstance = newSocket;
        
        newSocket.on('connect', () => {
          console.log('Socket connected with ID:', newSocket.id);
          setSocket(newSocket);
          setIsConnected(true);
          
          // If we have a gameId, join the game
          if (gameId) {
            console.log('Joining game with new socket:', gameId);
            newSocket.emit('joinGame', { gameId });
          }
          
          setIsLoading(false);
          setInitializing(false);
        });
        
        newSocket.on('disconnect', () => {
          console.log('Socket disconnected');
          setIsConnected(false);
        });
        
        newSocket.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          setError('Failed to connect to game server: ' + err.message);
          setIsLoading(false);
          setInitializing(false);
        });
        
        // Set up socket event listeners
        setupSocketListeners(newSocket);
      } catch (err) {
        console.error('Error initializing socket:', err);
        setError('Failed to initialize game connection');
        setIsLoading(false);
        setInitializing(false);
      }
    };
    
    connectToSocket();
    
    // Cleanup function
    return () => {
      // We don't disconnect the socket when unmounting
      // to allow it to be reused across the app
      // The socket will be automatically disconnected when the page is closed
    };
  }, [gameId]);
  
  // Set up event handlers for socket
  const setupSocketListeners = (socket: Socket) => {
    // Remove existing listeners to avoid duplicates
    socket.off('gameCreated');
    socket.off('gameJoined');
    socket.off('opponentJoined');
    socket.off('gameUpdated');
    socket.off('playerDisconnected');
    socket.off('gameRestarted');
    socket.off('error');
    
    // Handle game creation
    socket.on('gameCreated', (data) => {
      console.log('Game created:', data);
      setGameState({
        id: data.gameId,
        squares: Array(9).fill(null),
        players: { X: socket.id, O: null },
        currentTurn: 'X',
        role: 'X',
        shareUrl: data.shareUrl,
        createdAt: Date.now(),
        opponentConnected: false,
        restartRequested: { X: false, O: false },
      });
    });
    
    // Handle joining a game
    socket.on('gameJoined', (data) => {
      console.log('Game joined:', data);
      setGameState({
        ...data,
        role: data.role,
        opponentConnected: data.players.X && data.players.O,
      });
    });
    
    // Handle when opponent joins
    socket.on('opponentJoined', (data) => {
      console.log('Opponent joined:', data);
      setGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...data,
          opponentConnected: true,
        };
      });
    });
    
    // Handle game updates (moves)
    socket.on('gameUpdated', (data) => {
      console.log('Game updated:', data);
      setGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...data,
        };
      });
    });
    
    // Handle player disconnection
    socket.on('playerDisconnected', (data) => {
      console.log('Player disconnected:', data);
      setGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          opponentConnected: false,
        };
      });
    });
    
    // We can remove the restartRequested handler since we now restart immediately
    
    // Handle game restart
    socket.on('gameRestarted', (data) => {
      console.log('Game restarted event received:', data);
      
      try {
        // Validate the data
        if (!data || !data.id) {
          console.error('Invalid game state in gameRestarted event:', data);
          return;
        }
        
        // Reset the game state with direct state update for more reliability
        setGameState(prev => {
          if (!prev) {
            console.error('Previous game state is null in gameRestarted handler');
            return null;
          }
          
          const role = prev.role || 'X';
          console.log(`Resetting game state for player ${role}`);
          
          // Important: Create a completely new object to ensure React detects the change
          const newState: OnlineGameState = {
            id: data.id,
            squares: Array(9).fill(null), // Explicitly reset squares
            players: data.players || prev.players,
            currentTurn: 'X', // Always reset to X's turn
            role: role, // Preserve player role
            shareUrl: prev.shareUrl,
            opponentConnected: true, // Keep both players connected
            createdAt: data.createdAt || prev.createdAt,
            lastUpdated: Date.now(),
            restartRequested: { X: false, O: false }
          };
          
          console.log('New game state after restart:', newState);
          return newState;
        });
        
        console.log('Game state successfully reset');
      } catch (error) {
        console.error('Error handling gameRestarted event:', error);
      }
    });
    
    // Handle errors
    socket.on('error', (data) => {
      console.error('Socket error:', data);
      setError(data.message);
    });
  };
  
  // Create new game
  const createGame = useCallback(() => {
    if (!socket) {
      console.error("Cannot create game: Socket not connected");
      return;
    }
    
    console.log("Emitting createGame event");
    socket.emit('createGame');
  }, [socket]);
  
  // Join existing game
  const joinGame = useCallback((id: string) => {
    if (!socket) {
      console.error("Cannot join game: Socket not connected");
      return;
    }
    
    console.log("Joining game:", id);
    socket.emit('joinGame', { gameId: id });
  }, [socket]);
  
  // Make a move
  const makeMove = useCallback((index: number) => {
    if (!socket || !gameState) {
      console.error("Cannot make move: Socket not connected or game state missing");
      return;
    }
    
    console.log("Making move at index:", index, "in game:", gameState.id);
    socket.emit('makeMove', { gameId: gameState.id, index });
  }, [socket, gameState]);
  
  // Request to restart the game
  const requestRestart = useCallback(() => {
    console.log("requestRestart called, socket:", !!socket, "gameState:", !!gameState);
    
    if (!socket) {
      console.error("Cannot restart game: Socket not connected");
      return;
    }
    
    if (!gameState) {
      console.error("Cannot restart game: Game state missing");
      return;
    }
    
    if (!gameState.id) {
      console.error("Cannot restart game: Game ID missing in game state", gameState);
      return;
    }
    
    console.log("Requesting game restart for game:", gameState.id, "as player:", gameState.role);
    
    // Try-catch to handle any errors
    try {
      // Log event before sending
      console.log("Emitting restartGame event to server with payload:", { gameId: gameState.id });
      
      // Send restart request to server
      socket.emit('restartGame', { gameId: gameState.id });
      
      console.log("restartGame event emitted successfully");
    } catch (error) {
      console.error("Error sending restart request:", error);
    }
  }, [socket, gameState]);

  return {
    socket,
    gameState,
    error,
    isConnected,
    isLoading,
    createGame,
    joinGame,
    makeMove,
    requestRestart,
  };
}
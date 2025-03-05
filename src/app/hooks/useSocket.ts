'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
}

export default function useSocket(gameId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<OnlineGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const socketInitialized = useRef(false);
  
  // Initialize socket connection
  useEffect(() => {
    if (socketInitialized.current) return;
    
    socketInitialized.current = true;
    setIsLoading(true);
    
    // First fetch the socket endpoint to initialize the server
    console.log('Initializing socket.io server...');
    fetch('/api/socketio')
      .then(() => console.log('Socket.io server initialized via fetch'))
      .catch(err => console.error('Could not initialize socket.io server:', err));
      
    // Then create the socket connection with specific options for reliable connection
    console.log('Creating socket connection...');
    const socketInstance = io({
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000
    });
    
    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setSocket(socketInstance);
      setIsConnected(true);
      
      if (gameId) {
        // Join existing game if gameId is provided
        socketInstance.emit('joinGame', { gameId });
      }
      
      setIsLoading(false);
    });
    
    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });
    
    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to game server: ' + err.message);
      setIsLoading(false);
    });
    
    // Add more detailed error logging
    socketInstance.on('error', (err) => {
      console.error('Socket error:', err);
    });
    
    return () => {
      socketInstance.disconnect();
    };
  }, [gameId]);
  
  // Set up event handlers once socket is connected
  useEffect(() => {
    if (!socket) return;
    
    // Handle game creation
    socket.on('gameCreated', (data) => {
      console.log('Game created:', data);
      setGameState({
        ...data,
        squares: Array(9).fill(null),
        players: { X: socket.id, O: null },
        currentTurn: 'X',
        createdAt: Date.now(),
        opponentConnected: false,
      });
    });
    
    // Handle joining a game
    socket.on('gameJoined', (data) => {
      console.log('Game joined:', data);
      setGameState({
        ...data,
        opponentConnected: true,
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
    
    // Handle errors
    socket.on('error', (data) => {
      console.error('Socket error:', data);
      setError(data.message);
    });
    
    return () => {
      socket.off('gameCreated');
      socket.off('gameJoined');
      socket.off('opponentJoined');
      socket.off('gameUpdated');
      socket.off('playerDisconnected');
      socket.off('error');
    };
  }, [socket]);
  
  // Create new game
  const createGame = useCallback(() => {
    if (!socket) {
      console.error("Cannot create game: Socket not connected");
      return;
    }
    console.log("Emitting createGame event");
    
    // Direct call without waiting for acknowledgment
    socket.emit('createGame');
    
    // Fallback: create game manually if no response within 2 seconds
    setTimeout(() => {
      if (!gameState) {
        console.log("No game created after timeout, creating manually");
        const mockGameId = `manual-${Date.now()}`;
        setGameState({
          id: mockGameId,
          squares: Array(9).fill(null),
          players: { X: 'client', O: null },
          currentTurn: 'X',
          role: 'X',
          createdAt: Date.now(),
          shareUrl: `${window.location.origin}/play/${mockGameId}`,
          opponentConnected: false
        });
      }
    }, 2000);
  }, [socket, gameState]);
  
  // Join existing game
  const joinGame = useCallback((id: string) => {
    if (!socket) return;
    socket.emit('joinGame', { gameId: id });
  }, [socket]);
  
  // Make a move
  const makeMove = useCallback((index: number) => {
    if (!socket || !gameState) return;
    socket.emit('makeMove', { gameId: gameState.id, index });
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
  };
}
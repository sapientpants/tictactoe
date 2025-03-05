import { Server as NetServer } from 'http';
import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// Types for game state
interface GameState {
  id: string;
  squares: (string | null)[];
  players: {
    X: string | null;
    O: string | null;
  };
  currentTurn: 'X' | 'O';
  createdAt: number;
  lastUpdated?: number;
}

interface Games {
  [key: string]: GameState;
}

// In-memory store for games
const games: Games = {};

// Function to clean up old games (run periodically)
function cleanupOldGames() {
  const now = Date.now();
  const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
  
  Object.keys(games).forEach(gameId => {
    if (now - games[gameId].createdAt > MAX_AGE) {
      delete games[gameId];
    }
  });
}

// Socket.io server instance
let io: SocketIOServer;

export async function GET(req: NextRequest) {
  if (!io) {
    // Create Socket.io server if it doesn't exist
    const res = new NextResponse();
    const httpServer = res.socket?.server as unknown as NetServer;
    
    io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
    });
    
    // Set up Socket.io connection handler
    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);
      
      // Handle new game creation
      socket.on('createGame', () => {
        const gameId = uuidv4();
        games[gameId] = {
          id: gameId,
          squares: Array(9).fill(null),
          players: { X: socket.id, O: null },
          currentTurn: 'X',
          createdAt: Date.now(),
        };
        
        socket.join(gameId);
        socket.emit('gameCreated', {
          gameId,
          shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/play/${gameId}`,
          role: 'X',
        });
        
        console.log(`Game created: ${gameId}`);
      });
      
      // Handle joining a game
      socket.on('joinGame', ({ gameId }) => {
        const game = games[gameId];
        
        if (!game) {
          return socket.emit('error', { message: 'Game not found' });
        }
        
        // Check if this is a reconnection
        if (game.players.X === socket.id || game.players.O === socket.id) {
          socket.join(gameId);
          return socket.emit('gameJoined', {
            ...game,
            role: game.players.X === socket.id ? 'X' : 'O',
          });
        }
        
        // Check if the game is full
        if (game.players.X && game.players.O) {
          return socket.emit('error', { message: 'Game is full' });
        }
        
        // Join as player O if not already filled
        game.players.O = socket.id;
        socket.join(gameId);
        
        socket.emit('gameJoined', {
          ...game,
          role: 'O',
        });
        
        // Notify the other player
        io.to(gameId).emit('opponentJoined', {
          ...game,
        });
        
        console.log(`Player joined game: ${gameId}`);
      });
      
      // Handle a player's move
      socket.on('makeMove', ({ gameId, index }) => {
        const game = games[gameId];
        
        if (!game) {
          return socket.emit('error', { message: 'Game not found' });
        }
        
        // Determine player's role
        let role: 'X' | 'O' | null = null;
        if (game.players.X === socket.id) role = 'X';
        if (game.players.O === socket.id) role = 'O';
        
        if (!role) {
          return socket.emit('error', { message: 'You are not a player in this game' });
        }
        
        // Check if it's the player's turn
        if (game.currentTurn !== role) {
          return socket.emit('error', { message: 'Not your turn' });
        }
        
        // Check if the move is valid
        if (index < 0 || index > 8 || game.squares[index] !== null) {
          return socket.emit('error', { message: 'Invalid move' });
        }
        
        // Update game state
        game.squares[index] = role;
        game.currentTurn = role === 'X' ? 'O' : 'X';
        game.lastUpdated = Date.now();
        
        // Send updated game state to all players
        io.to(gameId).emit('gameUpdated', game);
        
        console.log(`Move made in game ${gameId} by ${role} at position ${index}`);
      });
      
      // Handle disconnections
      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        
        // Find any games this player was in
        Object.keys(games).forEach(gameId => {
          const game = games[gameId];
          
          if (game.players.X === socket.id) {
            io.to(gameId).emit('playerDisconnected', { player: 'X' });
          } else if (game.players.O === socket.id) {
            io.to(gameId).emit('playerDisconnected', { player: 'O' });
          }
        });
      });
    });
    
    // Set up periodic cleanup
    setInterval(cleanupOldGames, 3600000); // Run every hour
  }
  
  return new Response('Socket.io server running');
}
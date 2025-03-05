import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * Socket.io singleton setup for Next.js
 */

export const config = {
  api: {
    bodyParser: false,
  },
};

// Socket.io server instance
let io: SocketIOServer | null = null;

// In-memory game store
const games: Record<string, any> = {};

// Initialize socket server
export default async function SocketHandler(req: NextRequest, res: any) {
  // Return early if socket.io is already initialized
  if (res.socket.server.io) {
    console.log('Socket is already running');
    return res.end();
  }

  console.log('Initializing Socket.io server...');
  
  // Create new Socket.io server 
  io = new SocketIOServer(res.socket.server);
  res.socket.server.io = io;

  // Set up connection handler
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Handle game creation
    socket.on('createGame', () => {
      const gameId = uuidv4();
      
      // Create game state
      games[gameId] = {
        id: gameId,
        squares: Array(9).fill(null),
        currentTurn: 'X',
        players: { X: socket.id, O: null },
        createdAt: Date.now(),
      };
      
      // Join room
      socket.join(gameId);
      
      // Return game info
      socket.emit('gameCreated', { 
        gameId, 
        role: 'X',
        shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/play/${gameId}`,
      });
      
      console.log(`Game created: ${gameId}`);
    });

    // Handle joining a game
    socket.on('joinGame', ({ gameId }) => {
      const game = games[gameId];
      
      // Check if game exists
      if (!game) {
        return socket.emit('error', { message: 'Game not found' });
      }
      
      // Check if this is a reconnection
      if (game.players.X === socket.id || game.players.O === socket.id) {
        socket.join(gameId);
        const role = game.players.X === socket.id ? 'X' : 'O';
        return socket.emit('gameJoined', { ...game, role });
      }
      
      // Check if game is full
      if (game.players.X && game.players.O) {
        return socket.emit('error', { message: 'Game is full' });
      }
      
      // Join as player O
      game.players.O = socket.id;
      socket.join(gameId);
      
      // Emit events
      socket.emit('gameJoined', { ...game, role: 'O' });
      socket.to(gameId).emit('opponentJoined', game);
      
      console.log(`Player joined game: ${gameId}`);
    });

    // Handle game moves
    socket.on('makeMove', ({ gameId, index }) => {
      const game = games[gameId];
      
      if (!game) {
        return socket.emit('error', { message: 'Game not found' });
      }
      
      // Determine player role
      let role = null;
      if (game.players.X === socket.id) role = 'X';
      if (game.players.O === socket.id) role = 'O';
      
      if (!role) {
        return socket.emit('error', { message: 'You are not a player in this game' });
      }
      
      // Validate move
      if (game.currentTurn !== role) {
        return socket.emit('error', { message: 'Not your turn' });
      }
      
      if (game.squares[index] !== null) {
        return socket.emit('error', { message: 'Square already filled' });
      }
      
      // Update game state
      game.squares[index] = role;
      game.currentTurn = role === 'X' ? 'O' : 'X';
      
      // Broadcast to all players
      io?.to(gameId).emit('gameUpdated', game);
      
      console.log(`Move in game ${gameId} at position ${index}`);
    });

    // Handle disconnections
    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
      
      // Find games player was in
      Object.keys(games).forEach(gameId => {
        const game = games[gameId];
        
        if (game.players.X === socket.id) {
          io?.to(gameId).emit('playerDisconnected', { player: 'X' });
        } else if (game.players.O === socket.id) {
          io?.to(gameId).emit('playerDisconnected', { player: 'O' });
        }
      });
    });
  });

  console.log('Socket is initialized');
  res.end();
}
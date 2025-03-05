import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// Socket.io server instance
let io: SocketIOServer | null = null;

// Game state storage
const games: Record<string, any> = {};

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Initialize Socket.io server for Next.js
 */
export const initSocketServer = (server: NetServer) => {
  if (io) {
    console.log('Socket.io already initialized');
    return io;
  }
  
  console.log('Initializing Socket.io server...');
  
  // Create Socket.io server
  io = new SocketIOServer(server);
  
  // Connection handler
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Create game
    socket.on('createGame', () => {
      const gameId = uuidv4();
      
      games[gameId] = {
        id: gameId,
        squares: Array(9).fill(null),
        currentTurn: 'X',
        players: { X: socket.id, O: null },
        createdAt: Date.now(),
      };
      
      socket.join(gameId);
      socket.emit('gameCreated', {
        gameId,
        role: 'X',
        squares: Array(9).fill(null),
        currentTurn: 'X',
        shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/play/${gameId}`,
      });
      
      console.log(`Game created: ${gameId}`);
    });
    
    // Join game
    socket.on('joinGame', ({ gameId }) => {
      const game = games[gameId];
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      if (game.players.X === socket.id || game.players.O === socket.id) {
        // Reconnection
        socket.join(gameId);
        const role = game.players.X === socket.id ? 'X' : 'O';
        socket.emit('gameJoined', { ...game, role });
        return;
      }
      
      if (game.players.X && game.players.O) {
        socket.emit('error', { message: 'Game is full' });
        return;
      }
      
      game.players.O = socket.id;
      socket.join(gameId);
      
      socket.emit('gameJoined', { ...game, role: 'O' });
      socket.to(gameId).emit('opponentJoined', game);
      
      console.log(`Player joined game: ${gameId}`);
    });
    
    // Make move
    socket.on('makeMove', ({ gameId, index }) => {
      const game = games[gameId];
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      let role = null;
      if (game.players.X === socket.id) role = 'X';
      if (game.players.O === socket.id) role = 'O';
      
      if (!role) {
        socket.emit('error', { message: 'Not authorized to play in this game' });
        return;
      }
      
      if (game.currentTurn !== role) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }
      
      if (game.squares[index] !== null) {
        socket.emit('error', { message: 'Square already filled' });
        return;
      }
      
      game.squares[index] = role;
      game.currentTurn = role === 'X' ? 'O' : 'X';
      
      io.to(gameId).emit('gameUpdated', game);
      
      console.log(`Move made in game ${gameId} at index ${index}`);
    });
    
    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      Object.entries(games).forEach(([gameId, game]) => {
        if (game.players.X === socket.id) {
          io?.to(gameId).emit('playerDisconnected', { player: 'X' });
        } else if (game.players.O === socket.id) {
          io?.to(gameId).emit('playerDisconnected', { player: 'O' });
        }
      });
    });
  });
  
  console.log('Socket.io server initialized');
  return io;
};
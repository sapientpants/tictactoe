import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// Define types
export interface GameState {
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

export interface Games {
  [key: string]: GameState;
}

// Global variables outside of handler to maintain state
let io: SocketIOServer | null = null;
const games: Games = {};

export const socketConfig = {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
};

// Clean up old games periodically (called by server initialization)
function setupGameCleanup() {
  const interval = setInterval(() => {
    const now = Date.now();
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
    
    Object.keys(games).forEach(gameId => {
      if (now - games[gameId].createdAt > MAX_AGE) {
        console.log(`Cleaning up old game: ${gameId}`);
        delete games[gameId];
      }
    });
  }, 3600000); // Run every hour
  
  // Clean up interval on server restart/shutdown
  process.on('SIGTERM', () => clearInterval(interval));
  process.on('SIGINT', () => clearInterval(interval));
}

export function getSocketServer() {
  return io;
}

export function getGames() {
  return games;
}

export default function initSocketServer(server: NetServer) {
  if (io) {
    console.log('Socket.io already initialized, reusing instance');
    return io;
  }
  
  console.log('Creating new Socket.io server instance');
  io = new SocketIOServer(server, {
    ...socketConfig,
    // These settings help with connection stability
    pingTimeout: 30000,
    pingInterval: 25000,
    connectTimeout: 15000
  });
  
  // Set up Socket.io connection handler
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    
    // Handle new game creation
    socket.on('createGame', () => {
      console.log(`Creating game, requested by ${socket.id}`);
      const gameId = uuidv4();
      
      games[gameId] = {
        id: gameId,
        squares: Array(9).fill(null),
        players: { X: socket.id, O: null },
        currentTurn: 'X',
        createdAt: Date.now(),
      };
      
      socket.join(gameId);
      
      // Send game data back to the creator
      socket.emit('gameCreated', {
        gameId,
        shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/play/${gameId}`,
        role: 'X',
      });
      
      console.log(`Game created: ${gameId}`);
    });
    
    // Handle joining a game
    socket.on('joinGame', ({ gameId }) => {
      console.log(`Join game request for ${gameId} from ${socket.id}`);
      
      const game = games[gameId];
      
      if (!game) {
        console.log(`Game not found: ${gameId}`);
        return socket.emit('error', { message: 'Game not found' });
      }
      
      // Check if this is a reconnection
      if (game.players.X === socket.id) {
        console.log(`Player X reconnected: ${socket.id}`);
        socket.join(gameId);
        return socket.emit('gameJoined', {
          ...game,
          role: 'X',
        });
      }
      
      if (game.players.O === socket.id) {
        console.log(`Player O reconnected: ${socket.id}`);
        socket.join(gameId);
        return socket.emit('gameJoined', {
          ...game,
          role: 'O',
        });
      }
      
      // Check if the game is full
      if (game.players.X && game.players.O) {
        console.log(`Game ${gameId} is full, rejecting ${socket.id}`);
        return socket.emit('error', { message: 'Game is full' });
      }
      
      // Join as player O if X is already taken
      game.players.O = socket.id;
      socket.join(gameId);
      
      console.log(`Player O joined game ${gameId}: ${socket.id}`);
      
      // Send game state to the new player
      socket.emit('gameJoined', {
        ...game,
        role: 'O',
      });
      
      // Notify the other player
      socket.to(gameId).emit('opponentJoined', {
        ...game,
      });
    });
    
    // Handle a player's move
    socket.on('makeMove', ({ gameId, index }) => {
      console.log(`Move request in game ${gameId} at position ${index} by ${socket.id}`);
      
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
      
      console.log(`Valid move made in game ${gameId}, updating all clients`);
      
      // Send updated game state to all players
      io?.to(gameId).emit('gameUpdated', game);
    });
    
    // Handle game restart request
    socket.on('restartGame', ({ gameId }) => {
      console.log(`Restart game request for ${gameId} from ${socket.id}`);
      
      const game = games[gameId];
      
      if (!game) {
        console.log('Game not found for restart:', gameId);
        return socket.emit('error', { message: 'Game not found' });
      }
      
      // Determine player's role
      const isPlayerX = game.players.X === socket.id;
      const isPlayerO = game.players.O === socket.id;
      
      if (!isPlayerX && !isPlayerO) {
        console.log('Non-player trying to restart:', socket.id);
        return socket.emit('error', { message: 'You are not a player in this game' });
      }
      
      // Get player role
      const playerRole = isPlayerX ? 'X' : 'O';
      console.log(`Player ${playerRole} requesting restart for game ${gameId}`);
      
      // Initialize restart tracking if not exists
      if (!game.restartRequested) {
        game.restartRequested = { X: false, O: false };
      }
      
      // Mark this player as having requested restart
      game.restartRequested[playerRole] = true;
      
      console.log('Game restart status:', game.restartRequested);
      
      // Check if both players have requested restart
      const bothPlayersRequested = game.restartRequested.X && game.restartRequested.O;
      
      if (bothPlayersRequested) {
        console.log(`Both players have requested restart for game ${gameId}, restarting now`);
        
        // Reset the game board
        game.squares = Array(9).fill(null);
        game.currentTurn = 'X'; // X always starts
        game.lastUpdated = Date.now();
        game.restartRequested = { X: false, O: false };
        
        // Notify all players of restart
        io?.to(gameId).emit('gameRestarted', game);
        console.log(`Game ${gameId} has been restarted successfully`);
      } else {
        console.log(`Notifying players about restart request in game ${gameId}`);
        
        // Notify all players of the restart request (even the requester for confirmation)
        io?.to(gameId).emit('restartRequested', { 
          gameId,
          requestedBy: playerRole,
          bothPlayersRequested: false
        });
      }
    });
    
    // Handle disconnections
    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
      
      // Find any games this player was in
      Object.keys(games).forEach(gameId => {
        const game = games[gameId];
        
        if (game.players.X === socket.id) {
          console.log(`Player X disconnected from game ${gameId}`);
          io?.to(gameId).emit('playerDisconnected', { player: 'X' });
        } else if (game.players.O === socket.id) {
          console.log(`Player O disconnected from game ${gameId}`);
          io?.to(gameId).emit('playerDisconnected', { player: 'O' });
        }
      });
    });
  });
  
  // Setup scheduled cleanup
  setupGameCleanup();
  
  return io;
}
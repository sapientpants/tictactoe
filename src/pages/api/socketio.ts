import { Server as ServerIO } from "socket.io";
import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Socket.io server already initialized
  if (res.socket.server.io) {
    res.end();
    return;
  }

  // Create a new instance of socket.io server
  const io = new ServerIO(res.socket.server);
  res.socket.server.io = io;

  // Set up an in-memory game state store
  const games: Record<string, any> = {};

  // Handle socket connections
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Create a new game
    socket.on("createGame", () => {
      const gameId = uuidv4();
      games[gameId] = {
        id: gameId,
        squares: Array(9).fill(null),
        currentTurn: "X",
        players: { X: socket.id, O: null },
        createdAt: Date.now(),
      };

      socket.join(gameId);
      socket.emit("gameCreated", {
        gameId,
        role: "X",
        shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/play/${gameId}`,
      });

      console.log(`Game created: ${gameId}`);
    });

    // Join an existing game
    socket.on("joinGame", ({ gameId }) => {
      const game = games[gameId];

      if (!game) {
        socket.emit("error", { message: "Game not found" });
        return;
      }

      // Check if this is a reconnection
      if (game.players.X === socket.id || game.players.O === socket.id) {
        socket.join(gameId);
        const role = game.players.X === socket.id ? "X" : "O";
        socket.emit("gameJoined", { ...game, role });
        return;
      }

      // Check if game is full
      if (game.players.X && game.players.O) {
        socket.emit("error", { message: "Game is full" });
        return;
      }

      // Join as player O
      game.players.O = socket.id;
      socket.join(gameId);

      socket.emit("gameJoined", { ...game, role: "O" });
      socket.to(gameId).emit("opponentJoined", game);

      console.log(`Player joined game: ${gameId}`);
    });

    // Handle a move
    socket.on("makeMove", ({ gameId, index }) => {
      const game = games[gameId];

      if (!game) {
        socket.emit("error", { message: "Game not found" });
        return;
      }

      // Determine player role
      let role = null;
      if (game.players.X === socket.id) role = "X";
      if (game.players.O === socket.id) role = "O";

      if (!role) {
        socket.emit("error", { message: "Not a player in this game" });
        return;
      }

      // Validate move
      if (game.currentTurn !== role) {
        socket.emit("error", { message: "Not your turn" });
        return;
      }

      if (game.squares[index] !== null) {
        socket.emit("error", { message: "Square already filled" });
        return;
      }

      // Update game state
      game.squares[index] = role;
      game.currentTurn = role === "X" ? "O" : "X";

      // Broadcast to all players
      io.to(gameId).emit("gameUpdated", game);

      console.log(`Move made in game ${gameId} at position ${index}`);
    });

    // Handle disconnections
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);

      // Find any games this player was in
      Object.keys(games).forEach((gameId) => {
        const game = games[gameId];

        if (game.players.X === socket.id) {
          io.to(gameId).emit("playerDisconnected", { player: "X" });
        } else if (game.players.O === socket.id) {
          io.to(gameId).emit("playerDisconnected", { player: "O" });
        }
      });
    });
  });

  res.end();
}
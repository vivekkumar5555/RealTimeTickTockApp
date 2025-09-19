const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Game = require("../models/Game");

// Store active socket connections
const activeSockets = new Map();
const connectionAttempts = new Map(); // Track connection attempts per IP

const socketHandler = (io, socket) => {
  // Rate limiting for socket connections
  const clientIP = socket.handshake.address;
  const now = Date.now();
  const windowMs = 60000; // 1 minute window
  const maxAttempts = 5; // Max 5 connection attempts per minute

  if (!connectionAttempts.has(clientIP)) {
    connectionAttempts.set(clientIP, []);
  }

  const attempts = connectionAttempts.get(clientIP);
  // Remove old attempts outside the window
  const recentAttempts = attempts.filter((time) => now - time < windowMs);
  connectionAttempts.set(clientIP, recentAttempts);

  if (recentAttempts.length >= maxAttempts) {
    console.log(`Rate limit exceeded for IP: ${clientIP}`);
    socket.emit("auth_error", {
      message: "Too many connection attempts. Please wait before trying again.",
    });
    socket.disconnect();
    return;
  }

  // Record this connection attempt
  recentAttempts.push(now);
  connectionAttempts.set(clientIP, recentAttempts);

  // Authenticate socket connection
  socket.on("authenticate", async (data) => {
    try {
      const { token } = data;

      if (!token) {
        socket.emit("auth_error", { message: "No token provided" });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        socket.emit("auth_error", { message: "User not found" });
        return;
      }

      // Store user info with socket
      socket.userId = user._id.toString();
      socket.user = user;
      activeSockets.set(user._id.toString(), socket);

      // Update user online status
      user.isOnline = true;
      user.lastActive = new Date();
      await user.save();

      socket.emit("authenticated", {
        user: {
          id: user._id,
          username: user.username,
          eloRating: user.eloRating,
        },
      });

      console.log(`User ${user.username} authenticated via socket`);
    } catch (error) {
      console.error("Socket authentication error:", error);
      socket.emit("auth_error", { message: "Authentication failed" });
    }
  });

  // Join game room
  socket.on("join_game", async (data) => {
    try {
      console.log("JoinGame: Received join request:", data);
      console.log("JoinGame: Socket userId:", socket.userId);
      console.log("JoinGame: Socket user:", socket.user?.username);
      console.log("JoinGame: Current room:", socket.currentRoom);

      if (!socket.userId) {
        console.log("JoinGame: Not authenticated");
        socket.emit("error", { message: "Not authenticated" });
        return;
      }

      const { roomId } = data;

      // Check if already in this room
      if (socket.currentRoom === roomId) {
        console.log(
          "JoinGame: Already in room:",
          roomId,
          "skipping duplicate join"
        );
        return;
      }

      const game = await Game.findOne({ roomId }).populate(
        "player1 player2 currentPlayer",
        "username eloRating isOnline gamesPlayed gamesWon winRate"
      );

      if (!game) {
        socket.emit("error", { message: "Game not found" });
        return;
      }

      // Check if user is part of this game
      const player1Id = game.player1?._id || game.player1;
      const player2Id = game.player2?._id || game.player2;
      const isPlayer =
        player1Id.toString() === socket.userId ||
        (player2Id && player2Id.toString() === socket.userId);

      if (!isPlayer) {
        socket.emit("error", { message: "Not a player in this game" });
        return;
      }

      // Join the room
      socket.join(roomId);
      socket.currentRoom = roomId;
      console.log("JoinGame: User joined room:", {
        userId: socket.userId,
        username: socket.user?.username,
        roomId: roomId,
        currentRoom: socket.currentRoom,
        socketId: socket.id,
      });

      // Log all sockets in the room
      const currentRoomSockets = await io.in(roomId).fetchSockets();
      console.log(
        "JoinGame: Sockets in room",
        roomId,
        ":",
        currentRoomSockets.map((s) => ({
          socketId: s.id,
          userId: s.userId,
          username: s.user?.username,
        }))
      );

      // If this is the second player joining, update game status to active
      console.log("JoinGame: Checking game status update:", {
        gameStatus: game.status,
        player1Id: player1Id?.toString(),
        player2Id: player2Id?.toString(),
        socketUserId: socket.userId,
        isPlayer1: player1Id?.toString() === socket.userId,
        isPlayer2: player2Id?.toString() === socket.userId,
      });

      if (
        game.status === "waiting" &&
        player2Id &&
        player1Id.toString() !== socket.userId
      ) {
        game.status = "active";
        game.currentPlayer = game.player1; // Player1 starts
        await game.save();
        console.log("JoinGame: Game status updated to active");

        // Refresh the game data after status update
        await game.populate(
          "player1 player2 currentPlayer",
          "username eloRating isOnline gamesPlayed gamesWon winRate"
        );
      }

      // Notify others in the room with updated game state
      const broadcastRoomSockets = await io.in(roomId).fetchSockets();
      console.log(
        "JoinGame: Broadcasting player_joined event to room:",
        roomId,
        "Sockets in room:",
        broadcastRoomSockets.length
      );
      socket.to(roomId).emit("player_joined", {
        user: {
          id: socket.user._id,
          username: socket.user.username,
          eloRating: socket.user.eloRating,
        },
        game: {
          roomId: game.roomId,
          player1: game.player1,
          player2: game.player2,
          currentPlayer: game.currentPlayer,
          board: game.board,
          status: game.status,
          winner: game.winner,
          moves: game.moves,
        },
      });

      // Send current game state to the joining player
      socket.emit("game_state", {
        game: {
          roomId: game.roomId,
          player1: game.player1,
          player2: game.player2,
          currentPlayer: game.currentPlayer,
          board: game.board,
          status: game.status,
          winner: game.winner,
          moves: game.moves,
        },
      });

      console.log(`User ${socket.user.username} joined game ${roomId}`);
    } catch (error) {
      console.error("Join game error:", error);
      socket.emit("error", { message: "Failed to join game" });
    }
  });

  // Leave game room
  socket.on("leave_game", async (data) => {
    try {
      const { roomId } = data;
      socket.leave(roomId);
      socket.currentRoom = null;

      // Get updated game state before notifying others
      const game = await Game.findOne({ roomId }).populate(
        "player1 player2 currentPlayer",
        "username eloRating isOnline gamesPlayed gamesWon winRate"
      );

      if (game) {
        socket.to(roomId).emit("player_left", {
          user: {
            id: socket.user._id,
            username: socket.user.username,
          },
          game: {
            roomId: game.roomId,
            player1: game.player1,
            player2: game.player2,
            currentPlayer: game.currentPlayer,
            board: game.board,
            status: game.status,
            winner: game.winner,
            moves: game.moves,
          },
        });
      } else {
        socket.to(roomId).emit("player_left", {
          user: {
            id: socket.user._id,
            username: socket.user.username,
          },
        });
      }
    } catch (error) {
      console.error("Leave game error:", error);
    }
  });

  // Handle chat messages
  socket.on("send_chat_message", async (data) => {
    try {
      console.log("=== CHAT MESSAGE RECEIVED ===");
      console.log("Chat: Received message:", data);
      console.log("Chat: Socket userId:", socket.userId);
      console.log("Chat: Socket currentRoom:", socket.currentRoom);
      console.log("Chat: Socket user:", socket.user?.username);
      console.log("Chat: Socket connected:", socket.connected);

      if (!socket.userId) {
        console.log("Chat: Not authenticated");
        socket.emit("chat_error", { message: "Not authenticated" });
        return;
      }

      if (!socket.currentRoom) {
        console.log("Chat: Not in a game room");
        socket.emit("chat_error", { message: "Not in a game" });
        return;
      }

      const { roomId, message, sender } = data;

      // Verify the user is in this room
      const game = await Game.findOne({ roomId }).populate(
        "player1 player2",
        "username"
      );

      if (!game) {
        console.log("Chat: Game not found for roomId:", roomId);
        socket.emit("chat_error", { message: "Game not found" });
        return;
      }

      // Check if user is part of this game
      const player1Id = game.player1?._id || game.player1;
      const player2Id = game.player2?._id || game.player2;
      const isPlayer =
        player1Id.toString() === socket.userId ||
        (player2Id && player2Id.toString() === socket.userId);

      if (!isPlayer) {
        socket.emit("chat_error", {
          message: "You are not a player in this game",
        });
        return;
      }

      // Broadcast message to all players in the room
      const messageData = {
        message: {
          id: Date.now().toString(),
          message: message,
          sender: {
            id: socket.userId,
            username: socket.user?.username || "Unknown",
          },
          timestamp: new Date().toISOString(),
          roomId: roomId,
        },
      };

      console.log("Chat: Broadcasting message to room:", roomId);
      console.log("Chat: Message data:", messageData);

      // Get all sockets in the room for debugging
      const roomSockets = await io.in(roomId).fetchSockets();
      console.log(
        "Chat: Sockets in room",
        roomId,
        ":",
        roomSockets.map((s) => ({
          socketId: s.id,
          userId: s.userId,
          username: s.user?.username,
          currentRoom: s.currentRoom,
        }))
      );

      io.to(roomId).emit("chat_message", messageData);
      console.log("Chat: Message broadcasted to room:", roomId);
    } catch (error) {
      console.error("Chat socket error:", error);
      socket.emit("chat_error", { message: "Server error sending message" });
    }
  });

  // Handle message reactions
  socket.on("message_reaction", async (data) => {
    try {
      console.log("=== MESSAGE REACTION RECEIVED ===");
      console.log("Reaction: Received reaction:", data);
      console.log("Reaction: Socket userId:", socket.userId);
      console.log("Reaction: Socket currentRoom:", socket.currentRoom);

      if (!socket.userId) {
        console.log("Reaction: Not authenticated");
        socket.emit("chat_error", { message: "Not authenticated" });
        return;
      }

      if (!socket.currentRoom) {
        console.log("Reaction: Not in a game room");
        socket.emit("chat_error", { message: "Not in a game" });
        return;
      }

      const { messageId, reaction, userId, username } = data;

      // Broadcast reaction to all players in the room
      const reactionData = {
        messageId: messageId,
        reaction: reaction,
        user: {
          id: userId,
          username: username,
        },
        timestamp: new Date().toISOString(),
      };

      console.log(
        "Reaction: Broadcasting reaction to room:",
        socket.currentRoom
      );
      console.log("Reaction: Reaction data:", reactionData);
      io.to(socket.currentRoom).emit("message_reaction", reactionData);
      console.log(
        "Reaction: Reaction broadcasted to room:",
        socket.currentRoom
      );
    } catch (error) {
      console.error("Reaction socket error:", error);
      socket.emit("chat_error", {
        message: "Server error processing reaction",
      });
    }
  });

  // Handle message read receipts
  socket.on("message_read", async (data) => {
    try {
      console.log("=== MESSAGE READ RECEIPT RECEIVED ===");
      console.log("Read: Received read receipt:", data);
      console.log("Read: Socket userId:", socket.userId);
      console.log("Read: Socket currentRoom:", socket.currentRoom);

      if (!socket.userId) {
        console.log("Read: Not authenticated");
        socket.emit("chat_error", { message: "Not authenticated" });
        return;
      }

      if (!socket.currentRoom) {
        console.log("Read: Not in a game room");
        socket.emit("chat_error", { message: "Not in a game" });
        return;
      }

      const { messageId, userId, username, timestamp } = data;

      // Broadcast read receipt to all players in the room
      const readReceiptData = {
        messageId: messageId,
        readBy: {
          id: userId,
          username: username,
          timestamp: timestamp,
        },
      };

      console.log(
        "Read: Broadcasting read receipt to room:",
        socket.currentRoom
      );
      console.log("Read: Read receipt data:", readReceiptData);
      io.to(socket.currentRoom).emit("message_read", readReceiptData);
      console.log(
        "Read: Read receipt broadcasted to room:",
        socket.currentRoom
      );
    } catch (error) {
      console.error("Read receipt socket error:", error);
      socket.emit("chat_error", {
        message: "Server error processing read receipt",
      });
    }
  });

  // Handle rematch
  socket.on("rematch", async (data) => {
    try {
      console.log("Rematch: Received rematch request:", data);
      console.log("Rematch: Socket userId:", socket.userId);
      console.log("Rematch: Socket currentRoom:", socket.currentRoom);

      if (!socket.userId) {
        console.log("Rematch: Not authenticated");
        socket.emit("error", { message: "Not authenticated" });
        return;
      }

      if (!socket.currentRoom) {
        console.log("Rematch: Not in a game room");
        socket.emit("error", { message: "Not in a game" });
        return;
      }

      const game = await Game.findOne({ roomId: socket.currentRoom }).populate(
        "player1 player2 currentPlayer",
        "username eloRating isOnline gamesPlayed gamesWon winRate"
      );

      if (!game) {
        console.log("Rematch: Game not found for roomId:", socket.currentRoom);
        socket.emit("error", { message: "Game not found" });
        return;
      }

      // Check if user is part of this game
      const player1Id = game.player1?._id || game.player1;
      const player2Id = game.player2?._id || game.player2;
      const isPlayer =
        player1Id.toString() === socket.userId ||
        (player2Id && player2Id.toString() === socket.userId);

      if (!isPlayer) {
        socket.emit("error", { message: "Not a player in this game" });
        return;
      }

      // Reset the game state
      game.board = [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
      ];
      game.moves = [];
      game.status = "active";
      game.currentPlayer = game.player1; // Player1 starts the rematch
      game.winner = null;
      game.endTime = null;
      game.duration = 0;
      game.startTime = new Date();

      await game.save();

      // Broadcast rematch to all players in the room
      io.to(socket.currentRoom).emit("rematch_started", {
        game: {
          roomId: game.roomId,
          player1: game.player1,
          player2: game.player2,
          currentPlayer: game.currentPlayer,
          board: game.board,
          status: game.status,
          winner: game.winner,
          moves: game.moves,
        },
      });

      console.log(
        `Rematch started in game ${socket.currentRoom} by ${socket.user.username}`
      );
    } catch (error) {
      console.error("Rematch error:", error);
      socket.emit("error", { message: "Failed to start rematch" });
    }
  });

  // Make move
  socket.on("make_move", async (data) => {
    try {
      console.log("MakeMove: Received move request:", data);
      console.log("MakeMove: Socket userId:", socket.userId);
      console.log("MakeMove: Socket currentRoom:", socket.currentRoom);
      console.log("MakeMove: Socket user:", socket.user?.username);

      if (!socket.userId) {
        console.log("MakeMove: Not authenticated");
        socket.emit("error", { message: "Not authenticated" });
        return;
      }

      if (!socket.currentRoom) {
        console.log("MakeMove: Not in a game room");
        socket.emit("error", { message: "Not in a game" });
        return;
      }

      const { row, col } = data;
      console.log("MakeMove: Move coordinates:", { row, col });

      const game = await Game.findOne({ roomId: socket.currentRoom }).populate(
        "player1 player2 currentPlayer",
        "username eloRating isOnline gamesPlayed gamesWon winRate"
      );

      if (!game) {
        console.log("MakeMove: Game not found for roomId:", socket.currentRoom);
        socket.emit("error", { message: "Game not found" });
        return;
      }

      console.log("MakeMove: Game found:", {
        roomId: game.roomId,
        status: game.status,
        currentPlayer: game.currentPlayer?._id,
        player1: game.player1._id,
        player2: game.player2?._id,
        board: game.board,
      });

      // Make the move
      try {
        console.log(
          "MakeMove: Attempting to make move for user:",
          socket.userId
        );
        game.makeMove(socket.userId, row, col);
        console.log("MakeMove: Move successful");
      } catch (moveError) {
        console.log("MakeMove: Move failed:", moveError.message);
        socket.emit("move_error", { message: moveError.message });
        return;
      }

      // Check for winner or draw
      const winner = game.checkWinner();
      console.log("MakeMove: Winner check result:", winner);
      console.log("MakeMove: Board state:", game.board);

      if (winner) {
        // The winner is the player who just made the move
        const winnerId = socket.userId;
        console.log("MakeMove: Game won by:", winnerId, "symbol:", winner);
        game.endGame(winnerId);

        // Update ELO ratings
        await updateEloRatings(game);
      } else if (game.isBoardFull()) {
        console.log("MakeMove: Game ended in draw");
        game.endGame(); // Draw
        await updateEloRatings(game);
      }

      await game.save();

      // Refresh game data to include populated winner and updated player stats
      await game.populate(
        "winner player1 player2 currentPlayer",
        "username eloRating isOnline gamesPlayed gamesWon winRate"
      );

      // Broadcast move to all players in the room
      io.to(socket.currentRoom).emit("move_made", {
        game: {
          roomId: game.roomId,
          player1: game.player1,
          player2: game.player2,
          currentPlayer: game.currentPlayer,
          board: game.board,
          status: game.status,
          winner: game.winner,
          moves: game.moves,
        },
        move: {
          player: socket.userId,
          position: { row, col },
          timestamp: new Date(),
        },
      });

      console.log(
        `Move made in game ${socket.currentRoom} by ${socket.user.username}`
      );
    } catch (error) {
      console.error("Make move error:", error);
      socket.emit("error", { message: "Failed to make move" });
    }
  });

  // Handle disconnection
  socket.on("disconnect", async () => {
    try {
      if (socket.userId) {
        // Update user offline status
        const user = await User.findById(socket.userId);
        if (user) {
          user.isOnline = false;
          user.lastActive = new Date();
          await user.save();
        }

        // Remove from active sockets
        activeSockets.delete(socket.userId);

        // Notify current room if in a game
        if (socket.currentRoom) {
          socket.to(socket.currentRoom).emit("player_disconnected", {
            user: {
              id: socket.userId,
              username: socket.user?.username,
            },
          });
        }

        console.log(
          `User ${socket.user?.username || socket.userId} disconnected`
        );
      }

      // Clean up old connection attempts (older than 5 minutes)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      for (const [ip, attempts] of connectionAttempts.entries()) {
        const recentAttempts = attempts.filter((time) => time > fiveMinutesAgo);
        if (recentAttempts.length === 0) {
          connectionAttempts.delete(ip);
        } else {
          connectionAttempts.set(ip, recentAttempts);
        }
      }
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  });
};

// Helper function to update ELO ratings
const updateEloRatings = async (game) => {
  try {
    console.log(
      "SocketHandler UpdateEloRatings: Starting ELO update for game:",
      game.roomId
    );
    const { calculateEloRating } = require("../utils/eloRating");
    const player1 = await User.findById(game.player1);
    const player2 = await User.findById(game.player2);

    if (!player1 || !player2) {
      console.error("SocketHandler UpdateEloRatings: Player not found", {
        player1: player1 ? "found" : "not found",
        player2: player2 ? "found" : "not found",
        gamePlayer1: game.player1,
        gamePlayer2: game.player2,
      });
      throw new Error("One or both players not found in database");
    }

    let result1, result2;

    if (game.winner) {
      if (game.winner.toString() === player1._id.toString()) {
        result1 = "win";
        result2 = "loss";
      } else {
        result1 = "loss";
        result2 = "win";
      }
    } else {
      result1 = "draw";
      result2 = "draw";
    }

    console.log(
      "SocketHandler UpdateEloRatings: Results - Player1:",
      result1,
      "Player2:",
      result2
    );
    console.log(
      "SocketHandler UpdateEloRatings: Current ratings - Player1:",
      player1.eloRating,
      "Player2:",
      player2.eloRating
    );

    const { player1NewRating, player2NewRating } = calculateEloRating(
      player1.eloRating,
      player2.eloRating,
      result1,
      "player1"
    );

    console.log(
      "SocketHandler UpdateEloRatings: New ratings - Player1:",
      player1NewRating,
      "Player2:",
      player2NewRating
    );

    // Update player1
    try {
      player1.eloRating = player1NewRating;
      await player1.updateGameStats(result1);
      console.log(
        "SocketHandler UpdateEloRatings: Player1 stats updated successfully"
      );
    } catch (player1Error) {
      console.error(
        "SocketHandler UpdateEloRatings: Error updating player1 stats:",
        player1Error
      );
      throw new Error(
        `Failed to update player1 stats: ${player1Error.message}`
      );
    }

    // Update player2
    try {
      player2.eloRating = player2NewRating;
      await player2.updateGameStats(result2);
      console.log(
        "SocketHandler UpdateEloRatings: Player2 stats updated successfully"
      );
    } catch (player2Error) {
      console.error(
        "SocketHandler UpdateEloRatings: Error updating player2 stats:",
        player2Error
      );
      throw new Error(
        `Failed to update player2 stats: ${player2Error.message}`
      );
    }

    console.log(
      "SocketHandler UpdateEloRatings: ELO update completed successfully"
    );
  } catch (error) {
    console.error(
      "SocketHandler UpdateEloRatings: Critical error updating ELO ratings:",
      error
    );
    // Re-throw the error so the calling function knows the update failed
    throw error;
  }
};

module.exports = socketHandler;

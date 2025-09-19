const Game = require("../models/Game");
const User = require("../models/User");
const {
  calculateEloRating,
  getRatingCategory,
  getRatingChange,
} = require("../utils/eloRating");
const { generateRoomId } = require("../utils/roomIdGenerator");

// Helper function to clean up old games for a user
const cleanupUserGames = async (userId) => {
  try {
    console.log("CleanupUserGames: Cleaning up games for user:", userId);

    // Clean up old games for this user (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Only clean up games where the user is the only player (waiting games)
    // or games that are already abandoned
    const result = await Game.updateMany(
      {
        $or: [
          // User is player1 and no player2 (waiting game)
          { player1: userId, player2: null, status: "waiting" },
          // User is player2 and game is abandoned
          { player2: userId, status: "abandoned" },
          // User is player1 and game is abandoned
          { player1: userId, status: "abandoned" },
        ],
        createdAt: { $lt: oneHourAgo },
      },
      { status: "abandoned" }
    );

    console.log(
      "CleanupUserGames: Updated",
      result.modifiedCount,
      "games to abandoned"
    );

    // Also clean up any abandoned games that are very old (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deleteResult = await Game.deleteMany({
      status: "abandoned",
      updatedAt: { $lt: oneDayAgo },
    });

    console.log(
      "CleanupUserGames: Deleted",
      deleteResult.deletedCount,
      "old abandoned games"
    );
  } catch (error) {
    console.error("Error cleaning up user games:", error);
  }
};

// @desc    Create new game
// @route   POST /api/games
// @access  Private
const createGame = async (req, res) => {
  try {
    console.log("Server: Create game request received");
    const userId = req.user._id;
    console.log("Server: User ID:", userId);

    // Clean up old games for this user
    await cleanupUserGames(userId);

    // Check if user is already in an active game
    const existingGame = await Game.findOne({
      $or: [
        { player1: userId, status: { $in: ["waiting", "active"] } },
        { player2: userId, status: { $in: ["waiting", "active"] } },
      ],
    });

    if (existingGame) {
      console.log(
        "Server: User already in game:",
        existingGame.roomId,
        "Status:",
        existingGame.status
      );
      // Always clean up existing games and allow creating a new one
      console.log("Server: Cleaning up existing game and creating new one");
      await Game.findByIdAndUpdate(existingGame._id, { status: "abandoned" });
    }

    // Generate unique 6-digit room ID
    const roomId = await generateRoomId();
    console.log("Server: Generated room ID:", roomId);

    // Create new game
    const game = await Game.create({
      roomId,
      player1: userId,
      currentPlayer: userId,
    });
    console.log("Server: Game created:", game);

    await game.populate(
      "player1",
      "username eloRating gamesPlayed gamesWon winRate"
    );
    console.log("Server: Game populated with player1 data");

    res.status(201).json({
      success: true,
      message: "Game created successfully",
      data: { game },
    });
  } catch (error) {
    console.error("Server: Create game error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating game",
    });
  }
};

// @desc    Join game
// @route   POST /api/games/:roomId/join
// @access  Private
const joinGame = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    console.log("JoinGame API: Attempting to join game", { roomId, userId });

    // Clean up old games for this user first
    await cleanupUserGames(userId);

    const game = await Game.findOne({ roomId }).populate(
      "player1 player2 currentPlayer",
      "username eloRating gamesPlayed gamesWon winRate"
    );

    console.log("JoinGame API: Found game:", {
      gameId: game?._id,
      roomId: game?.roomId,
      player1: game?.player1?._id || game?.player1,
      player2: game?.player2?._id || game?.player2,
      status: game?.status,
      isFull: game?.isFull(),
    });

    if (!game) {
      console.log("JoinGame API: Game not found for roomId:", roomId);
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    if (game.isFull()) {
      console.log("JoinGame API: Game is full");
      return res.status(400).json({
        success: false,
        message: "Game is full",
      });
    }

    // Check if game is in waiting status
    if (game.status !== "waiting") {
      console.log("JoinGame API: Game is not in waiting status:", game.status);
      return res.status(400).json({
        success: false,
        message: `Game is ${game.status}. Only waiting games can be joined.`,
      });
    }

    if (game.player1.toString() === userId.toString()) {
      console.log("JoinGame API: User trying to join their own game");
      return res.status(400).json({
        success: false,
        message: "Cannot join your own game",
      });
    }

    // Check if user is already in another game
    const existingGame = await Game.findOne({
      $or: [
        { player1: userId, status: { $in: ["waiting", "active"] } },
        { player2: userId, status: { $in: ["waiting", "active"] } },
      ],
    });

    console.log("JoinGame API: Existing game check:", {
      userId,
      existingGame: existingGame?._id,
      existingGameStatus: existingGame?.status,
    });

    if (existingGame) {
      console.log(
        "JoinGame API: User already in a game, cleaning up existing game"
      );
      // Clean up existing game and allow joining new one
      await Game.findByIdAndUpdate(existingGame._id, { status: "abandoned" });
    }

    // Join the game
    game.player2 = userId;
    game.status = "active";
    // Ensure currentPlayer is set to player1 (who created the game)
    if (!game.currentPlayer) {
      game.currentPlayer = game.player1;
    }
    await game.populate(
      "player2",
      "username eloRating isOnline gamesPlayed gamesWon winRate"
    );
    await game.save();

    console.log("JoinGame API: Successfully joined game", {
      gameId: game._id,
      roomId: game.roomId,
      player1: game.player1._id,
      player2: game.player2._id,
      status: game.status,
    });

    res.json({
      success: true,
      message: "Joined game successfully",
      data: { game },
    });
  } catch (error) {
    console.error("Join game error:", error);
    res.status(500).json({
      success: false,
      message: "Server error joining game",
    });
  }
};

// @desc    Get game by room ID
// @route   GET /api/games/:roomId
// @access  Private
const getGame = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const game = await Game.findOne({ roomId }).populate(
      "player1 player2 winner currentPlayer",
      "username eloRating isOnline gamesPlayed gamesWon winRate"
    );

    if (!game) {
      console.log("GetGame: Game not found for roomId:", roomId);
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    console.log("GetGame: Game found:", {
      roomId: game.roomId,
      player1: game.player1._id,
      player2: game.player2?._id,
      status: game.status,
    });

    // Check if user is part of this game
    const isPlayer1 = game.player1._id.toString() === userId.toString();
    const isPlayer2 =
      game.player2 && game.player2._id.toString() === userId.toString();
    const isPlayer = isPlayer1 || isPlayer2;

    console.log("GetGame: Player check:", {
      userId: userId.toString(),
      player1Id: game.player1._id.toString(),
      player2Id: game.player2?._id?.toString(),
      isPlayer1,
      isPlayer2,
      isPlayer,
    });

    if (!isPlayer) {
      console.log("GetGame: Access denied - user not a player in this game");
      return res.status(403).json({
        success: false,
        message: "Access denied - not a player in this game",
      });
    }

    console.log("GetGame: Access granted, returning game data");
    res.json({
      success: true,
      data: { game },
    });
  } catch (error) {
    console.error("Get game error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting game",
    });
  }
};

// @desc    Make move
// @route   POST /api/games/:roomId/move
// @access  Private
const makeMove = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { row, col } = req.body;
    const userId = req.user._id;

    console.log("MakeMove API: Request received:", {
      roomId,
      row,
      col,
      userId,
    });
    console.log("MakeMove API: User:", req.user.username);

    const game = await Game.findOne({ roomId }).populate(
      "player1 player2 currentPlayer",
      "username eloRating isOnline gamesPlayed gamesWon winRate"
    );

    if (!game) {
      console.log("MakeMove API: Game not found for roomId:", roomId);
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    console.log("MakeMove API: Game found:", {
      roomId: game.roomId,
      player1: game.player1._id,
      player2: game.player2?._id,
      currentPlayer: game.currentPlayer?._id,
      status: game.status,
    });

    // Check if user is part of this game
    const isPlayer1 = game.player1._id.toString() === userId.toString();
    const isPlayer2 =
      game.player2 && game.player2._id.toString() === userId.toString();
    const isPlayer = isPlayer1 || isPlayer2;

    console.log("MakeMove API: Player check:", {
      userId: userId.toString(),
      player1Id: game.player1._id.toString(),
      player2Id: game.player2?._id?.toString(),
      isPlayer1,
      isPlayer2,
      isPlayer,
    });

    if (!isPlayer) {
      console.log(
        "MakeMove API: Access denied - user not a player in this game"
      );
      return res.status(403).json({
        success: false,
        message: "Access denied - not a player in this game",
      });
    }

    // Make the move
    try {
      console.log("MakeMove API: Attempting to make move:", {
        userId,
        row,
        col,
      });
      game.makeMove(userId, row, col);
      console.log("MakeMove API: Move successful");
    } catch (moveError) {
      console.log("MakeMove API: Move failed:", moveError.message);
      return res.status(400).json({
        success: false,
        message: moveError.message,
      });
    }

    // Check for winner or draw
    const winner = game.checkWinner();
    if (winner) {
      // The winner is the player who just made the move
      const winnerId = userId;
      game.endGame(winnerId);

      // Update ELO ratings
      await updateEloRatings(game);
    } else if (game.isBoardFull()) {
      game.endGame(); // Draw

      // Update ELO ratings for draw
      await updateEloRatings(game);
    }

    await game.save();

    // Refresh game data to include populated winner and updated player stats
    await game.populate(
      "winner player1 player2 currentPlayer",
      "username eloRating isOnline gamesPlayed gamesWon winRate"
    );

    res.json({
      success: true,
      message: "Move made successfully",
      data: { game },
    });
  } catch (error) {
    console.error("Make move error:", error);
    res.status(500).json({
      success: false,
      message: "Server error making move",
    });
  }
};

// @desc    Get user's games
// @route   GET /api/games/user/history
// @access  Private
const getUserGames = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const games = await Game.find({
      $or: [{ player1: userId }, { player2: userId }],
      status: "finished",
    })
      .populate(
        "player1 player2 winner",
        "username eloRating isOnline gamesPlayed gamesWon winRate"
      )
      .sort({ endTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Game.countDocuments({
      $or: [{ player1: userId }, { player2: userId }],
      status: "finished",
    });

    res.json({
      success: true,
      data: {
        games,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get user games error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting user games",
    });
  }
};

// Helper function to update ELO ratings
const updateEloRatings = async (game) => {
  try {
    console.log(
      "GameController UpdateEloRatings: Starting ELO update for game:",
      game.roomId
    );
    const { calculateEloRating } = require("../utils/eloRating");
    const player1 = await User.findById(game.player1);
    const player2 = await User.findById(game.player2);

    if (!player1 || !player2) {
      console.error("GameController UpdateEloRatings: Player not found", {
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
      "GameController UpdateEloRatings: Results - Player1:",
      result1,
      "Player2:",
      result2
    );
    console.log(
      "GameController UpdateEloRatings: Current ratings - Player1:",
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
      "GameController UpdateEloRatings: New ratings - Player1:",
      player1NewRating,
      "Player2:",
      player2NewRating
    );

    // Update player1
    try {
      player1.eloRating = player1NewRating;
      await player1.updateGameStats(result1);
      console.log(
        "GameController UpdateEloRatings: Player1 stats updated successfully"
      );
    } catch (player1Error) {
      console.error(
        "GameController UpdateEloRatings: Error updating player1 stats:",
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
        "GameController UpdateEloRatings: Player2 stats updated successfully"
      );
    } catch (player2Error) {
      console.error(
        "GameController UpdateEloRatings: Error updating player2 stats:",
        player2Error
      );
      throw new Error(
        `Failed to update player2 stats: ${player2Error.message}`
      );
    }

    console.log(
      "GameController UpdateEloRatings: ELO update completed successfully"
    );
  } catch (error) {
    console.error(
      "GameController UpdateEloRatings: Critical error updating ELO ratings:",
      error
    );
    // Re-throw the error so the calling function knows the update failed
    throw error;
  }
};

// @desc    Rematch - reset game in same room
// @route   POST /api/games/:roomId/rematch
// @access  Private
const rematch = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    console.log(
      "Rematch: Request received for roomId:",
      roomId,
      "by user:",
      userId
    );

    const game = await Game.findOne({ roomId }).populate(
      "player1 player2",
      "username eloRating isOnline gamesPlayed gamesWon winRate"
    );

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    // Check if user is part of this game
    const isPlayer1 = game.player1._id.toString() === userId.toString();
    const isPlayer2 =
      game.player2 && game.player2._id.toString() === userId.toString();
    const isPlayer = isPlayer1 || isPlayer2;

    if (!isPlayer) {
      return res.status(403).json({
        success: false,
        message: "Access denied - not a player in this game",
      });
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

    console.log("Rematch: Game reset successfully for roomId:", roomId);

    res.json({
      success: true,
      message: "Rematch started successfully",
      data: { game },
    });
  } catch (error) {
    console.error("Rematch error:", error);
    res.status(500).json({
      success: false,
      message: "Server error starting rematch",
    });
  }
};

// @desc    Clean up old games
// @route   POST /api/games/cleanup
// @access  Private
const cleanupOldGames = async (req, res) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await Game.updateMany(
      {
        status: { $in: ["waiting", "active"] },
        createdAt: { $lt: oneHourAgo },
      },
      { status: "abandoned" }
    );

    res.json({
      success: true,
      message: `Cleaned up ${result.modifiedCount} old games`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error("Cleanup old games error:", error);
    res.status(500).json({
      success: false,
      message: "Server error cleaning up games",
    });
  }
};

module.exports = {
  createGame,
  joinGame,
  getGame,
  makeMove,
  getUserGames,
  rematch,
  cleanupOldGames,
};

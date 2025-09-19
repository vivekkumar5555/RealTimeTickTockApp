const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    player1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    player2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    currentPlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    board: {
      type: [[String]],
      default: [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
      ],
    },
    status: {
      type: String,
      enum: ["waiting", "active", "finished", "abandoned"],
      default: "waiting",
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    moves: [
      {
        player: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        position: {
          row: { type: Number, required: true, min: 0, max: 2 },
          col: { type: Number, required: true, min: 0, max: 2 },
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Check if game is full
gameSchema.methods.isFull = function () {
  return this.player1 && this.player2;
};

// Check if position is valid
gameSchema.methods.isValidMove = function (row, col) {
  return (
    row >= 0 && row < 3 && col >= 0 && col < 3 && this.board[row][col] === ""
  );
};

// Make a move
gameSchema.methods.makeMove = function (playerId, row, col) {
  if (!this.isValidMove(row, col)) {
    throw new Error("Invalid move");
  }

  // Compare the _id field if currentPlayer is populated, otherwise compare directly
  const currentPlayerId = this.currentPlayer?._id || this.currentPlayer;
  const isCurrentPlayer =
    currentPlayerId && currentPlayerId.toString() === playerId.toString();

  console.log("Game.makeMove: Turn validation:", {
    currentPlayer: this.currentPlayer,
    currentPlayerId: currentPlayerId?.toString(),
    playerId: playerId.toString(),
    isCurrentPlayer,
  });

  if (!isCurrentPlayer) {
    throw new Error("Not your turn");
  }

  if (this.status !== "active") {
    throw new Error("Game is not active");
  }

  const player1Id = this.player1?._id || this.player1;
  const symbol = player1Id.toString() === playerId.toString() ? "X" : "O";
  this.board[row][col] = symbol;

  this.moves.push({
    player: playerId,
    position: { row, col },
  });

  // Switch current player
  const currentPlayerIdForSwitch =
    this.currentPlayer?._id || this.currentPlayer;
  const player1IdForSwitch = this.player1?._id || this.player1;
  this.currentPlayer =
    currentPlayerIdForSwitch &&
    currentPlayerIdForSwitch.toString() === player1IdForSwitch.toString()
      ? this.player2
      : this.player1;

  return this;
};

// Check for winner
gameSchema.methods.checkWinner = function () {
  const board = this.board;

  // Check rows
  for (let i = 0; i < 3; i++) {
    if (
      board[i][0] &&
      board[i][0] === board[i][1] &&
      board[i][1] === board[i][2]
    ) {
      return board[i][0];
    }
  }

  // Check columns
  for (let i = 0; i < 3; i++) {
    if (
      board[0][i] &&
      board[0][i] === board[1][i] &&
      board[1][i] === board[2][i]
    ) {
      return board[0][i];
    }
  }

  // Check diagonals
  if (
    board[0][0] &&
    board[0][0] === board[1][1] &&
    board[1][1] === board[2][2]
  ) {
    return board[0][0];
  }

  if (
    board[0][2] &&
    board[0][2] === board[1][1] &&
    board[1][1] === board[2][0]
  ) {
    return board[0][2];
  }

  return null;
};

// Check if board is full
gameSchema.methods.isBoardFull = function () {
  return this.board.every((row) => row.every((cell) => cell !== ""));
};

// End game
gameSchema.methods.endGame = function (winnerId = null) {
  this.status = "finished";
  this.winner = winnerId;
  this.endTime = new Date();
  this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  return this;
};

module.exports = mongoose.model("Game", gameSchema);

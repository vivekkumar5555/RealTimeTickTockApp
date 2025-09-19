const express = require("express");
const { body } = require("express-validator");
const {
  createGame,
  joinGame,
  getGame,
  makeMove,
  getUserGames,
  rematch,
  cleanupOldGames,
} = require("../controllers/gameController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Validation rules
const moveValidation = [
  body("row")
    .isInt({ min: 0, max: 2 })
    .withMessage("Row must be between 0 and 2"),
  body("col")
    .isInt({ min: 0, max: 2 })
    .withMessage("Column must be between 0 and 2"),
];

// @route   POST /api/games
// @desc    Create new game
// @access  Private
router.post("/", authenticateToken, createGame);

// @route   POST /api/games/:roomId/join
// @desc    Join game
// @access  Private
router.post("/:roomId/join", authenticateToken, joinGame);

// @route   GET /api/games/:roomId
// @desc    Get game by room ID
// @access  Private
router.get("/:roomId", authenticateToken, getGame);

// @route   POST /api/games/:roomId/move
// @desc    Make move
// @access  Private
router.post("/:roomId/move", authenticateToken, moveValidation, makeMove);

// @route   POST /api/games/:roomId/rematch
// @desc    Start rematch in same room
// @access  Private
router.post("/:roomId/rematch", authenticateToken, rematch);

// @route   GET /api/games/user/history
// @desc    Get user's game history
// @access  Private
router.get("/user/history", authenticateToken, getUserGames);

// @route   POST /api/games/cleanup
// @desc    Clean up old games
// @access  Private
router.post("/cleanup", authenticateToken, cleanupOldGames);

module.exports = router;

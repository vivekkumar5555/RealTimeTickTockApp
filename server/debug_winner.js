/**
 * Debug script to test winner detection
 */

const Game = require("./models/Game");

async function testWinnerDetection() {
  console.log("Testing winner detection...");

  // Create a test game
  const game = new Game({
    roomId: "test123",
    player1: "player1",
    player2: "player2",
    currentPlayer: "player1",
    board: [
      ["X", "O", "X"],
      ["", "", ""],
      ["", "", ""],
    ],
    status: "active",
  });

  console.log("Board:", game.board);
  console.log("Winner check result:", game.checkWinner());

  // Test with a winning row
  game.board = [
    ["X", "X", "X"],
    ["", "", ""],
    ["", "", ""],
  ];

  console.log("Winning board:", game.board);
  console.log("Winner check result:", game.checkWinner());
}

testWinnerDetection().catch(console.error);










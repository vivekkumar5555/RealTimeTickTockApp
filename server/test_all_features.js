/**
 * Comprehensive Test Script for Tic-Tac-Toe Application
 * Tests all functionality implemented yesterday
 */

const axios = require("axios");

const API_BASE = "http://localhost:5000/api";

// Test data
let testUser1 = {
  username: "testuser7",
  email: "test7@example.com",
  password: "Password123",
};

let testUser2 = {
  username: "testuser8",
  email: "test8@example.com",
  password: "Password123",
};

let user1Token = null;
let user2Token = null;
let gameRoomId = null;

async function testAuthentication() {
  console.log("\n=== Testing Authentication ===");

  try {
    // Register user 1
    const reg1 = await axios.post(`${API_BASE}/auth/register`, testUser1);
    console.log("✅ User 1 registered:", reg1.data.success);
    user1Token = reg1.data.data.token;

    // Register user 2
    const reg2 = await axios.post(`${API_BASE}/auth/register`, testUser2);
    console.log("✅ User 2 registered:", reg2.data.success);
    user2Token = reg2.data.data.token;

    // Login user 1
    const login1 = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser1.email,
      password: testUser1.password,
    });
    console.log("✅ User 1 login:", login1.data.success);

    // Login user 2
    const login2 = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser2.email,
      password: testUser2.password,
    });
    console.log("✅ User 2 login:", login2.data.success);
  } catch (error) {
    console.log(
      "❌ Authentication test failed:",
      error.response?.data?.message || error.message
    );
  }
}

async function testGameCreation() {
  console.log("\n=== Testing Game Creation ===");

  try {
    const response = await axios.post(
      `${API_BASE}/games`,
      {},
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );

    console.log("✅ Game created:", response.data.success);
    console.log("✅ Room ID:", response.data.data.game.roomId);
    console.log("✅ Game status:", response.data.data.game.status);
    console.log("✅ Player 1:", response.data.data.game.player1.username);

    gameRoomId = response.data.data.game.roomId;
  } catch (error) {
    console.log(
      "❌ Game creation test failed:",
      error.response?.data?.message || error.message
    );
  }
}

async function testGameJoining() {
  console.log("\n=== Testing Game Joining ===");

  try {
    const response = await axios.post(
      `${API_BASE}/games/${gameRoomId}/join`,
      {},
      {
        headers: { Authorization: `Bearer ${user2Token}` },
      }
    );

    console.log("✅ Game joined:", response.data.success);
    console.log("✅ Game status:", response.data.data.game.status);
    console.log("✅ Player 2:", response.data.data.game.player2.username);
    console.log(
      "✅ Current player:",
      response.data.data.game.currentPlayer.username
    );
  } catch (error) {
    console.log(
      "❌ Game joining test failed:",
      error.response?.data?.message || error.message
    );
  }
}

async function testGameMoves() {
  console.log("\n=== Testing Game Moves ===");

  try {
    // Player 1 makes first move (top-left)
    const move1 = await axios.post(
      `${API_BASE}/games/${gameRoomId}/move`,
      {
        row: 0,
        col: 0,
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );

    console.log("✅ Player 1 move made:", move1.data.success);
    console.log("✅ Board after move 1:", move1.data.data.game.board);

    // Player 2 makes second move (top-middle)
    const move2 = await axios.post(
      `${API_BASE}/games/${gameRoomId}/move`,
      {
        row: 0,
        col: 1,
      },
      {
        headers: { Authorization: `Bearer ${user2Token}` },
      }
    );

    console.log("✅ Player 2 move made:", move2.data.success);
    console.log("✅ Board after move 2:", move2.data.data.game.board);

    // Player 1 makes third move (middle-left) - should win
    const move3 = await axios.post(
      `${API_BASE}/games/${gameRoomId}/move`,
      {
        row: 1,
        col: 0,
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );

    console.log("✅ Player 1 move made:", move3.data.success);
    console.log("✅ Board after move 3:", move3.data.data.game.board);

    // Player 2 makes fourth move (middle-middle)
    const move4 = await axios.post(
      `${API_BASE}/games/${gameRoomId}/move`,
      {
        row: 1,
        col: 1,
      },
      {
        headers: { Authorization: `Bearer ${user2Token}` },
      }
    );

    console.log("✅ Player 2 move made:", move4.data.success);
    console.log("✅ Board after move 4:", move4.data.data.game.board);

    // Player 1 makes fifth move (bottom-left) - should win with diagonal
    const move5 = await axios.post(
      `${API_BASE}/games/${gameRoomId}/move`,
      {
        row: 2,
        col: 0,
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );

    console.log("✅ Player 1 move made:", move5.data.success);
    console.log("✅ Game status:", move5.data.data.game.status);
    console.log("✅ Winner:", move5.data.data.game.winner?.username);
    console.log("✅ Final board:", move5.data.data.game.board);
  } catch (error) {
    console.log(
      "❌ Game moves test failed:",
      error.response?.data?.message || error.message
    );
  }
}

async function testUserStats() {
  console.log("\n=== Testing User Stats ===");

  try {
    // Wait a moment for database updates to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get user 1 stats
    const user1 = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    console.log("✅ User 1 stats:");
    console.log("  - Games played:", user1.data.data.user.gamesPlayed);
    console.log("  - Games won:", user1.data.data.user.gamesWon);
    console.log("  - Win rate:", user1.data.data.user.winRate + "%");
    console.log("  - ELO rating:", user1.data.data.user.eloRating);

    // Get user 2 stats
    const user2 = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });

    console.log("✅ User 2 stats:");
    console.log("  - Games played:", user2.data.data.user.gamesPlayed);
    console.log("  - Games won:", user2.data.data.user.gamesWon);
    console.log("  - Win rate:", user2.data.data.user.winRate + "%");
    console.log("  - ELO rating:", user2.data.data.user.eloRating);
  } catch (error) {
    console.log(
      "❌ User stats test failed:",
      error.response?.data?.message || error.message
    );
  }
}

async function testGameHistory() {
  console.log("\n=== Testing Game History ===");

  try {
    const response = await axios.get(`${API_BASE}/games/user/history`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    console.log("✅ Game history retrieved:", response.data.success);
    console.log("✅ Total games:", response.data.data.pagination.total);
    console.log("✅ Games in history:", response.data.data.games.length);

    if (response.data.data.games.length > 0) {
      const game = response.data.data.games[0];
      console.log("✅ Latest game:");
      console.log("  - Room ID:", game.roomId);
      console.log("  - Status:", game.status);
      console.log("  - Winner:", game.winner?.username);
      console.log("  - Duration:", game.duration + "s");
    }
  } catch (error) {
    console.log(
      "❌ Game history test failed:",
      error.response?.data?.message || error.message
    );
  }
}

async function testRematch() {
  console.log("\n=== Testing Rematch ===");

  try {
    const response = await axios.post(
      `${API_BASE}/games/${gameRoomId}/rematch`,
      {},
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );

    console.log("✅ Rematch started:", response.data.success);
    console.log(
      "✅ Same room ID:",
      response.data.data.game.roomId === gameRoomId
    );
    console.log("✅ Game status:", response.data.data.game.status);
    console.log(
      "✅ Board reset:",
      JSON.stringify(response.data.data.game.board)
    );
  } catch (error) {
    console.log(
      "❌ Rematch test failed:",
      error.response?.data?.message || error.message
    );
  }
}

async function runAllTests() {
  console.log("🚀 Starting Comprehensive Tic-Tac-Toe Tests...\n");

  await testAuthentication();
  await testGameCreation();
  await testGameJoining();
  await testGameMoves();
  await testUserStats();
  await testGameHistory();
  await testRematch();

  console.log("\n🎉 All tests completed!");
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testAuthentication,
  testGameCreation,
  testGameJoining,
  testGameMoves,
  testUserStats,
  testGameHistory,
  testRematch,
  runAllTests,
};

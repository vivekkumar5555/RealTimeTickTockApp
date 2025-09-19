/**
 * Debug script to test user stats update
 */

const mongoose = require("mongoose");
const User = require("./models/User");

// Connect to database
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/tictactoe";
    await mongoose.connect(mongoURI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
};

async function testUserStats() {
  await connectDB();

  console.log("Testing user stats update...");

  // Clean up any existing test user first
  await User.findOneAndDelete({ username: "testuser" });
  console.log("Cleaned up existing test user");

  // Create a test user
  const user = new User({
    username: "testuser",
    email: "test@example.com",
    password: "Password123",
  });

  await user.save();
  console.log("User created:", {
    id: user._id,
    username: user.username,
    eloRating: user.eloRating,
    gamesPlayed: user.gamesPlayed,
    gamesWon: user.gamesWon,
    winRate: user.winRate,
  });

  // Test multiple game results
  console.log("\n=== Testing multiple game results ===");

  // Win
  await user.updateGameStats("win");
  console.log("After win:", {
    eloRating: user.eloRating,
    gamesPlayed: user.gamesPlayed,
    gamesWon: user.gamesWon,
    winRate: user.winRate,
  });

  // Loss
  await user.updateGameStats("loss");
  console.log("After loss:", {
    eloRating: user.eloRating,
    gamesPlayed: user.gamesPlayed,
    gamesWon: user.gamesWon,
    gamesLost: user.gamesLost,
    winRate: user.winRate,
  });

  // Draw
  await user.updateGameStats("draw");
  console.log("After draw:", {
    eloRating: user.eloRating,
    gamesPlayed: user.gamesPlayed,
    gamesWon: user.gamesWon,
    gamesLost: user.gamesLost,
    gamesDrawn: user.gamesDrawn,
    winRate: user.winRate,
  });

  // Another win
  await user.updateGameStats("win");
  console.log("After another win:", {
    eloRating: user.eloRating,
    gamesPlayed: user.gamesPlayed,
    gamesWon: user.gamesWon,
    gamesLost: user.gamesLost,
    gamesDrawn: user.gamesDrawn,
    winRate: user.winRate,
  });

  // Fetch fresh user data
  const freshUser = await User.findById(user._id);
  console.log("\n=== Final fresh user data ===");
  console.log("Fresh user data:", {
    eloRating: freshUser.eloRating,
    gamesPlayed: freshUser.gamesPlayed,
    gamesWon: freshUser.gamesWon,
    gamesLost: freshUser.gamesLost,
    gamesDrawn: freshUser.gamesDrawn,
    winRate: freshUser.winRate,
  });

  // Clean up
  await User.findByIdAndDelete(user._id);

  // Close connection
  await mongoose.connection.close();
}

testUserStats().catch(console.error);

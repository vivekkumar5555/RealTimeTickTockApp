const Game = require("../models/Game");

/**
 * Generate a unique 6-digit room ID
 * @returns {Promise<string>} A unique 6-digit room ID
 */
const generateRoomId = async () => {
  let roomId;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    // Generate a 6-digit number
    roomId = Math.floor(100000 + Math.random() * 900000).toString();

    // Check if this room ID already exists
    const existingGame = await Game.findOne({ roomId });
    if (!existingGame) {
      isUnique = true;
    }

    attempts++;
  }

  if (!isUnique) {
    // Fallback to timestamp-based ID if we can't find a unique 6-digit number
    roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  }

  return roomId;
};

module.exports = { generateRoomId };





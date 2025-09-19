/**
 * ELO Rating System for Tic-Tac-Toe
 * Based on the standard ELO formula with K-factor of 32
 */

const K_FACTOR = 32;
const INITIAL_RATING = 1200;

/**
 * Calculate new ELO ratings after a game
 * @param {number} player1Rating - Current rating of player 1
 * @param {number} player2Rating - Current rating of player 2
 * @param {string} result - 'win', 'loss', or 'draw'
 * @param {string} player - 'player1' or 'player2' - who the result is for
 * @returns {Object} - { player1NewRating, player2NewRating }
 */
function calculateEloRating(player1Rating, player2Rating, result, player) {
  // Calculate expected scores
  const expectedScore1 =
    1 / (1 + Math.pow(10, (player2Rating - player1Rating) / 400));
  const expectedScore2 =
    1 / (1 + Math.pow(10, (player1Rating - player2Rating) / 400));

  // Determine actual scores based on result
  let actualScore1, actualScore2;

  if (result === "draw") {
    actualScore1 = 0.5;
    actualScore2 = 0.5;
  } else if (result === "win" && player === "player1") {
    actualScore1 = 1;
    actualScore2 = 0;
  } else if (result === "win" && player === "player2") {
    actualScore1 = 0;
    actualScore2 = 1;
  } else if (result === "loss" && player === "player1") {
    actualScore1 = 0;
    actualScore2 = 1;
  } else if (result === "loss" && player === "player2") {
    actualScore1 = 1;
    actualScore2 = 0;
  } else {
    throw new Error("Invalid result or player parameter");
  }

  // Calculate new ratings
  const newRating1 = Math.round(
    player1Rating + K_FACTOR * (actualScore1 - expectedScore1)
  );
  const newRating2 = Math.round(
    player2Rating + K_FACTOR * (actualScore2 - expectedScore2)
  );

  return {
    player1NewRating: Math.max(0, newRating1), // Ensure rating doesn't go below 0
    player2NewRating: Math.max(0, newRating2),
  };
}

/**
 * Get rating category based on ELO score
 * @param {number} rating - ELO rating
 * @returns {string} - Rating category
 */
function getRatingCategory(rating) {
  if (rating >= 2000) return "Master";
  if (rating >= 1800) return "Expert";
  if (rating >= 1600) return "Advanced";
  if (rating >= 1400) return "Intermediate";
  if (rating >= 1200) return "Beginner";
  return "Novice";
}

/**
 * Calculate rating change display
 * @param {number} oldRating - Previous rating
 * @param {number} newRating - New rating
 * @returns {Object} - { change, isPositive }
 */
function getRatingChange(oldRating, newRating) {
  const change = newRating - oldRating;
  return {
    change: Math.abs(change),
    isPositive: change > 0,
    display: change > 0 ? `+${change}` : change.toString(),
  };
}

module.exports = {
  calculateEloRating,
  getRatingCategory,
  getRatingChange,
  INITIAL_RATING,
  K_FACTOR,
};

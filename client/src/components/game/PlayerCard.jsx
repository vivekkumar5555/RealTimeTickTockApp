import React from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Target } from "lucide-react";

/**
 * Player card component
 * @param {Object} props - Component props
 * @param {Object} props.player - Player object
 * @param {boolean} props.isCurrentPlayer - Current player indicator
 * @param {boolean} props.isWinner - Winner indicator
 * @param {'X'|'O'|null} props.symbol - Player symbol
 */
const PlayerCard = ({
  player,
  isCurrentPlayer = false,
  isWinner = false,
  symbol = null,
}) => {
  const getRatingCategory = (rating) => {
    if (rating >= 2000) return { name: "Master", color: "text-purple-600" };
    if (rating >= 1800) return { name: "Expert", color: "text-blue-600" };
    if (rating >= 1600) return { name: "Advanced", color: "text-green-600" };
    if (rating >= 1400)
      return { name: "Intermediate", color: "text-yellow-600" };
    if (rating >= 1200) return { name: "Beginner", color: "text-orange-600" };
    return { name: "Novice", color: "text-gray-600" };
  };

  const ratingCategory = getRatingCategory(player.eloRating);

  return (
    <motion.div
      className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
        isCurrentPlayer
          ? "border-primary-500 bg-primary-50 shadow-lg"
          : "border-gray-200 bg-white"
      } ${isWinner ? "ring-4 ring-yellow-400 ring-opacity-50" : ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Winner indicator */}
      {isWinner && (
        <motion.div
          className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 p-1 rounded-full"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
        >
          <Trophy className="w-4 h-4" />
        </motion.div>
      )}

      {/* Current player indicator */}
      {isCurrentPlayer && (
        <motion.div
          className="absolute -top-2 -left-2 bg-primary-500 text-white p-1 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Target className="w-4 h-4" />
        </motion.div>
      )}

      {/* Player info */}
      <div className="text-center">
        {/* Username */}
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          {player.username}
        </h3>

        {/* Symbol */}
        {symbol && (
          <motion.div
            className={`text-3xl font-bold mb-2 ${
              symbol === "X" ? "text-blue-600" : "text-red-600"
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
          >
            {symbol}
          </motion.div>
        )}

        {/* ELO Rating */}
        <div className="mb-2">
          <div className="flex items-center justify-center space-x-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-600">
              {player.eloRating}
            </span>
            <span className={`text-xs font-medium ${ratingCategory.color}`}>
              {ratingCategory.name}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
          <div>
            <div className="font-semibold">{player.gamesPlayed}</div>
            <div>Games</div>
          </div>
          <div>
            <div className="font-semibold text-green-600">
              {player.gamesWon}
            </div>
            <div>Wins</div>
          </div>
          <div>
            <div className="font-semibold text-blue-600">{player.winRate}%</div>
            <div>Win Rate</div>
          </div>
        </div>

        {/* Online status */}
        <div className="mt-2 flex items-center justify-center space-x-1">
          <div
            className={`w-2 h-2 rounded-full ${
              player.isOnline ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          <span className="text-xs text-gray-500">
            {player.isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerCard;

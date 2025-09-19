import React from "react";
import { motion } from "framer-motion";
import GameCell from "./GameCell";

/**
 * Game board component
 * @param {Object} props - Component props
 * @param {Object} props.game - Game object
 * @param {string} props.currentUserId - Current user ID
 * @param {Function} props.onMove - Move handler function
 * @param {boolean} props.disabled - Disabled state
 */
const GameBoard = ({ game, currentUserId, onMove, disabled = false }) => {
  const isCurrentPlayer =
    game.currentPlayer && game.currentPlayer._id === currentUserId;
  const canMakeMove = isCurrentPlayer && game.status === "active" && !disabled;

  const getWinningCells = () => {
    if (!game.winner) return [];

    const board = game.board;
    const winningCells = [];

    // Check rows
    for (let i = 0; i < 3; i++) {
      if (
        board[i][0] &&
        board[i][0] === board[i][1] &&
        board[i][1] === board[i][2]
      ) {
        winningCells.push([i, 0], [i, 1], [i, 2]);
        return winningCells;
      }
    }

    // Check columns
    for (let i = 0; i < 3; i++) {
      if (
        board[0][i] &&
        board[0][i] === board[1][i] &&
        board[1][i] === board[2][i]
      ) {
        winningCells.push([0, i], [1, i], [2, i]);
        return winningCells;
      }
    }

    // Check diagonals
    if (
      board[0][0] &&
      board[0][0] === board[1][1] &&
      board[1][1] === board[2][2]
    ) {
      winningCells.push([0, 0], [1, 1], [2, 2]);
      return winningCells;
    }

    if (
      board[0][2] &&
      board[0][2] === board[1][1] &&
      board[1][1] === board[2][0]
    ) {
      winningCells.push([0, 2], [1, 1], [2, 0]);
      return winningCells;
    }

    return winningCells;
  };

  const winningCells = getWinningCells();

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-3 gap-2 p-4 bg-white rounded-xl shadow-lg">
        {game.board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <GameCell
              key={`${rowIndex}-${colIndex}`}
              value={cell}
              row={rowIndex}
              col={colIndex}
              isWinning={winningCells.some(
                ([r, c]) => r === rowIndex && c === colIndex
              )}
              onClick={onMove}
              disabled={!canMakeMove}
            />
          ))
        )}
      </div>

      {game.status === "waiting" && (
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-gray-600">Waiting for another player to join...</p>
        </motion.div>
      )}

      {game.status === "active" && !canMakeMove && (
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-gray-600">{game.currentPlayer?.username}'s turn</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default GameBoard;

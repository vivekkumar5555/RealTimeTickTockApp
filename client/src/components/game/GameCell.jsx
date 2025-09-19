import React from "react";
import { motion } from "framer-motion";

/**
 * Individual game cell component
 * @param {Object} props - Component props
 * @param {string} props.value - Cell value (X, O, or empty)
 * @param {number} props.row - Row index
 * @param {number} props.col - Column index
 * @param {boolean} props.isWinning - Winning cell indicator
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.disabled - Disabled state
 */
const GameCell = ({
  value,
  row,
  col,
  isWinning = false,
  onClick,
  disabled = false,
}) => {
  const handleClick = () => {
    if (!disabled && !value) {
      onClick(row, col);
    }
  };

  const getSymbolColor = () => {
    if (value === "X") return "text-blue-600";
    if (value === "O") return "text-red-600";
    return "text-gray-400";
  };

  const getCellClasses = () => {
    const baseClasses =
      "game-cell aspect-square flex items-center justify-center text-4xl font-bold rounded-lg border-2 transition-all duration-200";
    const stateClasses =
      disabled || value
        ? "cursor-not-allowed"
        : "cursor-pointer hover:bg-gray-50";
    const winningClasses = isWinning
      ? "bg-green-100 border-green-500 winning"
      : "border-gray-300";
    const filledClasses = value ? "bg-gray-50" : "bg-white";

    return `${baseClasses} ${stateClasses} ${winningClasses} ${filledClasses}`;
  };

  return (
    <motion.div
      className={getCellClasses()}
      onClick={handleClick}
      whileHover={!disabled && !value ? { scale: 1.05 } : {}}
      whileTap={!disabled && !value ? { scale: 0.95 } : {}}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {value && (
        <motion.span
          className={getSymbolColor()}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
        >
          {value}
        </motion.span>
      )}
    </motion.div>
  );
};

export default GameCell;

import React from "react";
import { motion } from "framer-motion";
import Card from "./Card";

/**
 * Loading spinner component with various sizes and animations
 * @param {Object} props - Component props
 * @param {string} props.size - Spinner size (sm, md, lg, xl)
 * @param {string} props.color - Spinner color
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.text - Loading text
 */
const LoadingSpinner = ({
  size = "md",
  color = "primary",
  className = "",
  text = "",
}) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const colors = {
    primary: "border-primary-600",
    white: "border-white",
    gray: "border-gray-600",
  };

  const classes = `${sizes[size]} ${colors[color]} ${className}`;

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <motion.div
        className={`border-4 border-t-transparent rounded-full ${classes}`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      {text && (
        <motion.p
          className="text-sm text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

/**
 * Full screen loading overlay
 * @param {Object} props - Component props
 * @param {string} props.text - Loading text
 * @param {boolean} props.show - Show/hide overlay
 */
export const LoadingOverlay = ({ text = "Loading...", show = true }) => {
  if (!show) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Card className="p-8">
        <LoadingSpinner size="lg" text={text} />
      </Card>
    </motion.div>
  );
};

export default LoadingSpinner;

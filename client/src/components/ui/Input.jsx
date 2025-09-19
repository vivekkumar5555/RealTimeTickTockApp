import React from "react";
import { motion } from "framer-motion";

/**
 * Input component with various styles and validation states
 * @param {Object} props - Component props
 * @param {string} props.type - Input type
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.label - Label text
 * @param {string} props.error - Error message
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.required - Required state
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.rest - Additional props
 */
const Input = ({
  type = "text",
  placeholder = "",
  value = "",
  onChange,
  label = "",
  error = "",
  disabled = false,
  required = false,
  className = "",
  ...rest
}) => {
  const baseClasses =
    "w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const stateClasses = error
    ? "border-error-500 focus:ring-error-500 focus:border-error-500"
    : "border-gray-300 focus:ring-primary-500 focus:border-primary-500";

  const classes = `${baseClasses} ${stateClasses} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <motion.input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={classes}
        whileFocus={{ scale: 1.01 }}
        {...rest}
      />
      {error && (
        <motion.p
          className="mt-1 text-sm text-error-600"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default Input;

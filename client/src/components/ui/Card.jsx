import React from "react";
import { motion } from "framer-motion";

/**
 * Card component with glass morphism effect
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.variant - Card variant (default, glass, elevated)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.hover - Hover effect
 * @param {Object} props.rest - Additional props
 */
const Card = ({
  children,
  variant = "default",
  className = "",
  hover = false,
  ...rest
}) => {
  const baseClasses = "rounded-xl border transition-all duration-300";

  const variants = {
    default: "bg-white border-gray-200 shadow-sm",
    glass: "glass border-white/20 shadow-lg",
    elevated: "bg-white border-gray-200 shadow-lg",
  };

  const hoverClasses = hover ? "card-hover" : "";
  const classes = `${baseClasses} ${variants[variant]} ${hoverClasses} ${className}`;

  return (
    <motion.div
      className={classes}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

/**
 * Card header component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Header content
 * @param {string} props.className - Additional CSS classes
 */
const CardHeader = ({ children, className = "", ...rest }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`} {...rest}>
    {children}
  </div>
);

/**
 * Card body component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Body content
 * @param {string} props.className - Additional CSS classes
 */
const CardBody = ({ children, className = "", ...rest }) => (
  <div className={`px-6 py-4 ${className}`} {...rest}>
    {children}
  </div>
);

/**
 * Card footer component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Footer content
 * @param {string} props.className - Additional CSS classes
 */
const CardFooter = ({ children, className = "", ...rest }) => (
  <div className={`px-6 py-4 border-t border-gray-200 ${className}`} {...rest}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;

import React from "react";
import { motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

/**
 * Chat toggle button component
 */
const ChatToggle = ({ isOpen, onToggle, unreadCount = 0 }) => {
  return (
    <motion.button
      onClick={onToggle}
      className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-xl transition-all duration-300 ${
        isOpen
          ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
          : "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white"
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, delay: 0.5 }}
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      <div className="flex items-center justify-center">
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </div>

      {/* Unread count badge */}
      {unreadCount > 0 && !isOpen && (
        <motion.div
          className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </motion.div>
      )}

      {/* Pulse animation for new messages */}
      {unreadCount > 0 && !isOpen && (
        <motion.div
          className="absolute inset-0 rounded-full bg-red-500 opacity-20"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
};

export default ChatToggle;

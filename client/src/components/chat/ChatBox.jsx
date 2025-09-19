import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { SOCKET_EVENTS } from "../../types";
import Button from "../ui/Button";
import {
  X,
  Send,
  Minimize2,
  Maximize2,
  Smile,
  Check,
  CheckCheck,
} from "lucide-react";
import { toast } from "react-hot-toast";
import "./ChatBox.css";

/**
 * Chat box component for real-time messaging
 */
const ChatBox = ({
  isOpen,
  onToggle,
  onMinimize,
  roomId,
  messages = [],
  // Socket functions passed from parent component
  emit,
  on,
  off,
  isConnected,
}) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [readMessages, setReadMessages] = useState(new Set());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleChatError = useCallback((data) => {
    toast.error(data.message);
  }, []);

  const handleMessageDoubleClick = useCallback(
    (message) => {
      // Add a reaction to the message
      const reactions = ["👍", "❤️", "😂", "😮", "😢", "😡"];
      const randomReaction =
        reactions[Math.floor(Math.random() * reactions.length)];

      // Emit reaction event
      emit("message_reaction", {
        messageId: message.id,
        reaction: randomReaction,
        userId: user.id,
        username: user.username,
      });

      toast.success(`Reacted with ${randomReaction}`);
    },
    [emit, user]
  );

  const addEmojiToMessage = useCallback((emoji) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  }, []);

  const markMessageAsRead = useCallback(
    (messageId) => {
      if (!readMessages.has(messageId)) {
        setReadMessages((prev) => new Set([...prev, messageId]));

        // Emit read receipt to server
        emit("message_read", {
          messageId: messageId,
          userId: user.id,
          username: user.username,
          timestamp: new Date().toISOString(),
        });
      }
    },
    [readMessages, emit, user]
  );

  const handleMessageView = useCallback(
    (message) => {
      // Mark message as read if it's not from current user
      if (message.sender.id !== user.id) {
        markMessageAsRead(message.id);
      }
    },
    [user.id, markMessageAsRead]
  );

  useEffect(() => {
    if (isOpen) {
      console.log("ChatBox: Chat opened, setting up listeners");

      // Set up socket listeners
      on(SOCKET_EVENTS.CHAT_ERROR, handleChatError);

      // Focus input when chat opens
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }

    return () => {
      off(SOCKET_EVENTS.CHAT_ERROR, handleChatError);
    };
  }, [isOpen, on, off, handleChatError]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when they come into view
  useEffect(() => {
    if (!isOpen || isMinimized) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.dataset.messageId;
            const message = messages.find((m) => m.id === messageId);
            if (message) {
              handleMessageView(message);
            }
          }
        });
      },
      { threshold: 0.5 } // Trigger when 50% of message is visible
    );

    // Observe all message elements
    const messageElements = document.querySelectorAll("[data-message-id]");
    messageElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [messages, isOpen, isMinimized, handleMessageView]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !user) return;

    const messageData = {
      roomId,
      message: newMessage.trim(),
      sender: {
        id: user.id,
        username: user.username,
      },
    };

    console.log("ChatBox: Sending message:", messageData);
    console.log("ChatBox: Socket connected:", isConnected);
    console.log("ChatBox: Socket event:", SOCKET_EVENTS.SEND_CHAT_MESSAGE);

    // Always try to send the message
    try {
      emit(SOCKET_EVENTS.SEND_CHAT_MESSAGE, messageData);
      console.log("ChatBox: Message sent successfully");

      // Clear the input immediately for better UX
      setNewMessage("");

      // Don't add to local state here - let the server broadcast handle it
      // This prevents double messages
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    onMinimize(!isMinimized);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed bottom-28 sm:bottom-32 md:bottom-36 right-4 z-50 chat-container ${
          isMinimized
            ? "w-72 sm:w-80 h-12"
            : "w-72 sm:w-80 md:w-96 h-80 sm:h-96 md:h-[28rem]"
        } transition-all duration-500 ease-in-out shadow-2xl`}
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-3 sm:px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isConnected
                    ? "bg-green-400 animate-pulse"
                    : "bg-red-400 animate-pulse"
                }`}
              ></div>
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-semibold text-sm sm:text-base truncate">
                  Game Chat {!isConnected && "(Connecting...)"}
                </h3>
                {!isConnected && (
                  <p className="text-xs text-white/80 mt-0.5 truncate">
                    Connecting to server...
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              <button
                onClick={handleMinimize}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-300 ease-in-out hover:scale-105 shadow-sm"
                aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
              >
                {isMinimized ? (
                  <Maximize2 className="w-5 h-5 transition-transform duration-300 ease-in-out" />
                ) : (
                  <Minimize2 className="w-5 h-5 transition-transform duration-300 ease-in-out" />
                )}
              </button>
              <button
                onClick={onToggle}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-300 ease-in-out hover:scale-105 shadow-sm"
                aria-label="Close chat"
              >
                <X className="w-5 h-5 transition-transform duration-300 ease-in-out" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="h-72 sm:h-80 md:h-96 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 bg-gradient-to-b from-gray-50 to-gray-100 chat-scrollbar chat-messages pb-4 sm:pb-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                      <Smile className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium">No messages yet</p>
                    <p className="text-xs mt-1 text-gray-400">
                      Start the conversation!
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <motion.div
                      key={index}
                      data-message-id={message.id}
                      className={`flex ${
                        message.sender.id === user.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        duration: 0.4,
                        ease: "easeOut",
                        delay: index * 0.05,
                      }}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-xs ${
                          message.sender.id === user.id ? "order-2" : "order-1"
                        }`}
                      >
                        <div
                          className={`px-3 py-2 rounded-2xl cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.02] shadow-sm message-bubble ${
                            message.sender.id === user.id
                              ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-br-md hover:from-primary-600 hover:to-primary-700 shadow-primary-200"
                              : "bg-white text-gray-800 rounded-bl-md border border-gray-200 hover:bg-gray-50 hover:shadow-md"
                          }`}
                          onDoubleClick={() =>
                            handleMessageDoubleClick(message)
                          }
                          title="Double-click to react!"
                        >
                          <p className="text-sm">{message.message}</p>
                          {message.reactions &&
                            message.reactions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {message.reactions.map((reaction, idx) => (
                                  <span
                                    key={idx}
                                    className={`text-xs px-2 py-1 rounded-full transition-all duration-200 hover:scale-105 ${
                                      message.sender.id === user.id
                                        ? "bg-white/20 text-white"
                                        : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {reaction.emoji}{" "}
                                    {reaction.count > 1 && (
                                      <span className="ml-1 font-medium">
                                        {reaction.count}
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}
                        </div>
                        <div
                          className={`flex items-center space-x-1 mt-1 ${
                            message.sender.id === user.id
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <span className="text-xs text-gray-500 font-medium">
                            {message.sender.id === user.id
                              ? "You"
                              : message.sender.username}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatTime(message.timestamp)}
                          </span>
                          {message.sender.id === user.id && (
                            <div className="flex items-center ml-1">
                              {message.readBy && message.readBy.length > 0 ? (
                                <CheckCheck className="w-4 h-4 text-blue-500 transition-colors duration-200" />
                              ) : (
                                <Check className="w-4 h-4 text-gray-500 transition-colors duration-200" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} className="h-4 sm:h-6" />
              </div>

              {/* Input */}
              <form
                onSubmit={sendMessage}
                className="p-2 sm:p-3 md:p-4 border-t border-gray-200 bg-white"
              >
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={
                        !isConnected
                          ? "Connecting to server..."
                          : "Type a message..."
                      }
                      className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm disabled:opacity-50 transition-all duration-300 ease-in-out hover:border-gray-400"
                      disabled={!user || !isConnected}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full transition-all duration-300 ease-in-out hover:scale-105 ${
                        showEmojiPicker
                          ? "text-primary-500 bg-primary-50"
                          : "text-gray-500 hover:text-primary-500 hover:bg-gray-100"
                      }`}
                      disabled={!user || !isConnected}
                      aria-label="Toggle emoji picker"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!newMessage.trim() || !user || !isConnected}
                    className="rounded-full p-2 sm:p-2.5 hover:scale-105 transition-all duration-300 ease-in-out shadow-xl border-2 border-white/30 min-w-[2.5rem] min-h-[2.5rem] sm:min-w-[3rem] sm:min-h-[3rem] bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md font-bold" />
                  </Button>
                </div>

                {/* Emoji Picker */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="mt-2 sm:mt-3 p-2 sm:p-3 bg-white border border-gray-200 rounded-xl shadow-xl backdrop-blur-sm"
                    >
                      <div className="grid grid-cols-8 gap-1 sm:gap-2">
                        {[
                          "😀",
                          "😂",
                          "😍",
                          "🤔",
                          "😮",
                          "😢",
                          "😡",
                          "👍",
                          "👎",
                          "❤️",
                          "🎉",
                          "🔥",
                          "💯",
                          "👏",
                          "🙌",
                          "😎",
                        ].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => addEmojiToMessage(emoji)}
                            className="text-lg hover:bg-gray-100 rounded-lg p-1.5 sm:p-2 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-sm emoji-button"
                            aria-label={`Add ${emoji} emoji`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatBox;

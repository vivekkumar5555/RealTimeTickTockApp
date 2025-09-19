import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import { LogOut, User, Trophy, Settings } from "lucide-react";

/**
 * Header component with user menu and navigation
 */
const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getRatingCategory = (rating) => {
    if (rating >= 2000) return { name: "Master", color: "text-purple-600" };
    if (rating >= 1800) return { name: "Expert", color: "text-blue-600" };
    if (rating >= 1600) return { name: "Advanced", color: "text-green-600" };
    if (rating >= 1400)
      return { name: "Intermediate", color: "text-yellow-600" };
    if (rating >= 1200) return { name: "Beginner", color: "text-orange-600" };
    return { name: "Novice", color: "text-gray-600" };
  };

  const ratingCategory = user ? getRatingCategory(user.eloRating) : null;

  return (
    <motion.header
      className="bg-white shadow-lg border-b border-gray-200"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <h1 className="text-xl font-bold gradient-text">Tic-Tac-Toe</h1>
          </motion.div>

          {/* User Menu */}
          {isAuthenticated && user && user.username ? (
            <div className="relative">
              <motion.button
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setShowUserMenu(!showUserMenu)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.username
                      ? user.username.charAt(0).toUpperCase()
                      : "U"}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">
                    {user.username || "User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.eloRating || 1200} ELO
                  </p>
                </div>
              </motion.button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <motion.div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {user.username
                            ? user.username.charAt(0).toUpperCase()
                            : "U"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {user.username || "User"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {user.email || "No email"}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium text-gray-600">
                            {user.eloRating || 1200}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              ratingCategory?.color || "text-gray-600"
                            }`}
                          >
                            {ratingCategory?.name || "Novice"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="text-center">
                      <div>
                        <p className="text-lg font-semibold text-gray-800">
                          {user.gamesPlayed || 0}
                        </p>
                        <p className="text-xs text-gray-500">Games Played</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate("/settings");
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
              <Button variant="primary" size="sm">
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay to close menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </motion.header>
  );
};

export default Header;

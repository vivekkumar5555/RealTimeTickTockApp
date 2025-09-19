import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import apiClient from "../utils/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import {
  ArrowLeft,
  Trophy,
  Target,
  Clock,
  TrendingUp,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";

/**
 * Profile page component
 */
const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [gameHistory, setGameHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    eloRating: 1200,
    averageGameDuration: 0,
    longestWinStreak: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    loadGameHistory();
  }, []);

  const loadGameHistory = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getUserGames();

      if (response.success) {
        setGameHistory(response.data.games);
        calculateStats(response.data.games);
      }
    } catch (error) {
      console.error("Error loading game history:", error);
      toast.error("Failed to load game history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      // Refresh user data from server
      await refreshUser();
      // Reload game history
      await loadGameHistory();
    } catch (error) {
      console.error("Error refreshing profile:", error);
      toast.error("Failed to refresh profile");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (games) => {
    const totalGames = games.length;
    const wins = games.filter(
      (game) => game.winner && game.winner._id === user.id
    ).length;
    const losses = games.filter(
      (game) => game.winner && game.winner._id !== user.id
    ).length;
    const draws = games.filter((game) => !game.winner).length;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    const totalDuration = games.reduce(
      (sum, game) => sum + (game.duration || 0),
      0
    );
    const averageGameDuration =
      totalGames > 0 ? Math.round(totalDuration / totalGames) : 0;

    setStats({
      totalGames,
      wins,
      losses,
      draws,
      winRate,
      eloRating: user.eloRating || 1200,
      averageGameDuration,
      longestWinStreak: calculateLongestWinStreak(games),
      currentStreak: calculateCurrentStreak(games),
    });
  };

  const calculateLongestWinStreak = (games) => {
    let maxStreak = 0;
    let currentStreak = 0;

    games.forEach((game) => {
      if (game.winner && game.winner._id === user.id) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else if (game.winner) {
        currentStreak = 0;
      }
    });

    return maxStreak;
  };

  const calculateCurrentStreak = (games) => {
    let currentStreak = 0;

    for (let i = games.length - 1; i >= 0; i--) {
      const game = games[i];
      if (game.winner && game.winner._id === user.id) {
        currentStreak++;
      } else if (game.winner) {
        break;
      }
    }

    return currentStreak;
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getRatingCategory = (rating) => {
    if (rating >= 2000)
      return { name: "Master", color: "text-purple-600", bg: "bg-purple-100" };
    if (rating >= 1800)
      return { name: "Expert", color: "text-blue-600", bg: "bg-blue-100" };
    if (rating >= 1600)
      return { name: "Advanced", color: "text-green-600", bg: "bg-green-100" };
    if (rating >= 1400)
      return {
        name: "Intermediate",
        color: "text-yellow-600",
        bg: "bg-yellow-100",
      };
    if (rating >= 1200)
      return {
        name: "Beginner",
        color: "text-orange-600",
        bg: "bg-orange-100",
      };
    return { name: "Novice", color: "text-gray-600", bg: "bg-gray-100" };
  };

  const ratingCategory = getRatingCategory(stats.eloRating);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 text-center">
              <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {user?.username}
              </h2>
              <p className="text-gray-600 mb-4">{user?.email}</p>

              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${ratingCategory.bg} ${ratingCategory.color}`}
              >
                <Trophy className="w-4 h-4 mr-1" />
                {ratingCategory.name}
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">ELO Rating</span>
                  <span className="font-semibold text-yellow-600">
                    {stats.eloRating}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Win Rate</span>
                  <span className="font-semibold text-blue-600">
                    {stats.winRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Streak</span>
                  <span className="font-semibold text-green-600">
                    {stats.currentStreak}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Longest Streak</span>
                  <span className="font-semibold text-purple-600">
                    {stats.longestWinStreak}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="p-4 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {stats.totalGames}
                </h3>
                <p className="text-sm text-gray-600">Total Games</p>
              </Card>

              <Card className="p-4 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {stats.wins}
                </h3>
                <p className="text-sm text-gray-600">Wins</p>
              </Card>

              <Card className="p-4 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {stats.losses}
                </h3>
                <p className="text-sm text-gray-600">Losses</p>
              </Card>

              <Card className="p-4 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {stats.draws}
                </h3>
                <p className="text-sm text-gray-600">Draws</p>
              </Card>
            </div>

            {/* Game History */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Recent Games
              </h3>
              {gameHistory.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No games played yet
                </p>
              ) : (
                <div className="space-y-3">
                  {gameHistory.slice(0, 10).map((game, index) => {
                    const isWinner = game.winner && game.winner._id === user.id;
                    const isDraw = !game.winner;
                    const opponent =
                      game.player1._id === user.id
                        ? game.player2
                        : game.player1;

                    return (
                      <motion.div
                        key={game._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isWinner
                                ? "bg-green-100 text-green-600"
                                : isDraw
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {isWinner ? (
                              <Trophy className="w-4 h-4" />
                            ) : isDraw ? (
                              <Clock className="w-4 h-4" />
                            ) : (
                              <Target className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              vs {opponent?.username || "Unknown"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {game.duration
                                ? formatDuration(game.duration)
                                : "N/A"}{" "}
                              •
                              {new Date(
                                game.endTime || game.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-semibold ${
                              isWinner
                                ? "text-green-600"
                                : isDraw
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {isWinner ? "Won" : isDraw ? "Draw" : "Lost"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Room: {game.roomId}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

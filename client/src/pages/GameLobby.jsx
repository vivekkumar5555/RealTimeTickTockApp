import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../context/AuthContext";
import apiClient from "../utils/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { Plus, Users, Trophy, Clock, Zap } from "lucide-react";
import { toast } from "react-hot-toast";

/**
 * Game lobby component
 */
const GameLobby = () => {
  const { user } = useAuth();
  const { emit, on, off, isConnected } = useSocket();
  const navigate = useNavigate();
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [availableGames, setAvailableGames] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Socket event listeners
    on("authenticated", handleAuthenticated);
    on("game_created", handleGameCreated);
    on("game_joined", handleGameJoined);
    on("game_list_updated", handleGameListUpdated);
    on("online_users_count", handleOnlineUsersCount);

    return () => {
      off("authenticated", handleAuthenticated);
      off("game_created", handleGameCreated);
      off("game_joined", handleGameJoined);
      off("game_list_updated", handleGameListUpdated);
      off("online_users_count", handleOnlineUsersCount);
    };
  }, []);

  const handleAuthenticated = () => {
    console.log("Socket authenticated");
  };

  const handleGameCreated = (data) => {
    console.log("Game created:", data);
    toast.success("Game created successfully!");
    // Navigate to game room using React Router
    navigate(`/game/${data.game.roomId}`);
  };

  const handleGameJoined = (data) => {
    console.log("Game joined:", data);
    toast.success("Joined game successfully!");
    // Navigate to game room using React Router
    navigate(`/game/${data.game.roomId}`);
  };

  const handleGameListUpdated = (data) => {
    setAvailableGames(data.games || []);
  };

  const handleOnlineUsersCount = (data) => {
    setOnlineUsers(data.count || 0);
  };

  const createGame = async () => {
    try {
      console.log("GameLobby: Starting game creation...");
      setIsCreatingGame(true);
      const response = await apiClient.createGame();
      console.log("GameLobby: Game creation response:", response);

      if (response.success) {
        console.log("GameLobby: Game created successfully, redirecting...");
        // Emit socket event to notify others
        emit("game_created", { game: response.data.game });
        // Navigate to game room using React Router
        navigate(`/game/${response.data.game.roomId}`);
      } else {
        console.error("GameLobby: Game creation failed:", response.message);
        toast.error(response.message || "Failed to create game");
      }
    } catch (error) {
      console.error("GameLobby: Create game error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create game";
      toast.error(errorMessage);
    } finally {
      setIsCreatingGame(false);
    }
  };

  const joinGame = async (gameRoomId) => {
    try {
      setIsJoiningGame(true);
      const response = await apiClient.joinGame(gameRoomId);

      if (response.success) {
        // Emit socket event to notify others
        emit("game_joined", { game: response.data.game });
        // Navigate to game room using React Router
        navigate(`/game/${gameRoomId}`);
      }
    } catch (error) {
      console.error("Join game error:", error);
      toast.error("Failed to join game");
    } finally {
      setIsJoiningGame(false);
    }
  };

  const joinGameByRoomId = async () => {
    if (!roomId.trim()) {
      toast.error("Please enter a room ID");
      return;
    }

    if (isNavigating) {
      console.log("GameLobby: Already navigating, skipping join request");
      return;
    }

    try {
      setIsJoiningGame(true);
      console.log(
        "GameLobby: Attempting to join game with roomId:",
        roomId.trim()
      );

      const response = await apiClient.joinGame(roomId.trim());
      console.log("GameLobby: Join game response:", response);

      if (response.success) {
        console.log(
          "GameLobby: Successfully joined game, navigating to:",
          `/game/${roomId.trim()}`
        );
        setIsNavigating(true);

        // Check if socket is connected before emitting
        if (isConnected) {
          console.log(
            "GameLobby: Socket is connected, emitting game_joined event"
          );
          emit("game_joined", { game: response.data.game });
        } else {
          console.log("GameLobby: Socket not connected, skipping emit");
        }

        // Use setTimeout to ensure the socket event is processed before navigation
        setTimeout(() => {
          console.log("GameLobby: Navigating to game room");
          navigate(`/game/${roomId.trim()}`);
        }, 200);
      }
    } catch (error) {
      console.error("Join game error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to join game";
      toast.error(errorMessage);
    } finally {
      setIsJoiningGame(false);
      setIsNavigating(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome to Tic-Tac-Toe
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Challenge players from around the world in real-time matches
          </p>

          {/* Stats */}
          <div className="flex justify-center space-x-8">
            <div className="flex items-center space-x-2 text-gray-600">
              <Users className="w-5 h-5" />
              <span>{onlineUsers} online</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Trophy className="w-5 h-5" />
              <span>{user?.eloRating} ELO</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Zap className="w-5 h-5" />
              <span>{user?.winRate}% win rate</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Game */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-8 text-center" hover>
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Create New Game
              </h2>
              <p className="text-gray-600 mb-6">
                Start a new game and wait for another player to join
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={createGame}
                loading={isCreatingGame}
                disabled={isCreatingGame}
                className="w-full"
              >
                {isCreatingGame ? "Creating..." : "Create Game"}
              </Button>
            </Card>
          </motion.div>

          {/* Join Game */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="p-8" hover>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-success-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Join Game
                </h2>
                <p className="text-gray-600">
                  Enter a room ID to join an existing game
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter 6-digit Room ID (e.g., 123456)"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
                  disabled={isJoiningGame}
                />
                <Button
                  variant="success"
                  size="lg"
                  onClick={joinGameByRoomId}
                  loading={isJoiningGame}
                  disabled={isJoiningGame || isNavigating || !roomId.trim()}
                  className="w-full"
                >
                  {isJoiningGame
                    ? "Joining..."
                    : isNavigating
                    ? "Navigating..."
                    : "Join Game"}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Available Games */}
        {availableGames.length > 0 && (
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Available Games
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableGames.map((game) => (
                <Card key={game.roomId} className="p-4" hover>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">
                        Room:
                      </span>
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded font-mono text-sm font-bold">
                        {game.roomId}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {new Date(game.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Host:{" "}
                      <span className="font-medium">
                        {game.player1.username}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      ELO: {game.player1.eloRating}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => joinGame(game.roomId)}
                    disabled={isJoiningGame}
                    className="w-full"
                  >
                    Join Game
                  </Button>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GameLobby;

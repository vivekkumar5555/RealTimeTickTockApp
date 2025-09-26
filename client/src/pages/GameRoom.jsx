import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import apiClient from "../utils/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import GameBoard from "../components/game/GameBoard";
import PlayerCard from "../components/game/PlayerCard";
import ChatBox from "../components/chat/ChatBox";
import ChatToggle from "../components/chat/ChatToggle";
import { ArrowLeft, RotateCcw, Trophy, Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import { SOCKET_EVENTS } from "../types";

/**
 * Game room component
 */
const GameRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  // Direct socket management
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const [game, setGame] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMakingMove, setIsMakingMove] = useState(false);
  const [gameStatus, setGameStatus] = useState("loading");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [isSocketSetup, setIsSocketSetup] = useState(false);
  const socketSetupRef = useRef(false);

  // Socket connection function
  const connectSocket = useCallback(() => {
    console.log("GameRoom: Creating socket connection...");

    if (socketRef.current?.connected) {
      console.log("GameRoom: Socket already connected");
      return;
    }

    // Clean up existing socket
    if (socketRef.current) {
      console.log("GameRoom: Cleaning up existing socket");
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socketUrl = "https://realtimeticktockappserver-93we.onrender.com";
    console.log("GameRoom: Connecting to:", socketUrl);

    const newSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    newSocket.on("connect", () => {
      console.log("GameRoom: Socket connected successfully!");
      console.log("GameRoom: Socket ID:", newSocket.id);
      setIsConnected(true);

      // Authenticate with token
      const token = localStorage.getItem("token");
      if (token) {
        console.log("GameRoom: Authenticating socket...");
        newSocket.emit("authenticate", { token });
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("GameRoom: Socket disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("GameRoom: Socket connection error:", error);
      setIsConnected(false);
    });

    newSocket.on("authenticated", (data) => {
      console.log("GameRoom: Socket authenticated successfully");
      console.log(
        "GameRoom: Authenticated user:",
        data.user?.username,
        "ID:",
        data.user?.id
      );
    });

    newSocket.on("auth_error", (error) => {
      console.error("GameRoom: Socket authentication failed:", error);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    console.log("GameRoom: Socket created and assigned:", {
      socketExists: !!socketRef.current,
      socketConnected: socketRef.current?.connected,
      socketId: socketRef.current?.id,
    });
  }, []);

  // Socket emit function
  const emit = useCallback(
    (event, data) => {
      console.log("GameRoom: Emitting event:", event, data);
      if (socketRef.current?.connected) {
        console.log("GameRoom: Socket connected, emitting message");
        socketRef.current.emit(event, data);
      } else {
        console.log("GameRoom: Socket not connected, attempting to connect...");
        connectSocket();
        // Try to emit after a short delay
        setTimeout(() => {
          if (socketRef.current?.connected) {
            console.log("GameRoom: Socket connected, emitting message");
            socketRef.current.emit(event, data);
          } else {
            console.warn("GameRoom: Still not connected, message lost");
          }
        }, 1000);
      }
    },
    [connectSocket]
  );

  // Socket event listeners
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  // Handler functions
  const handleGameState = useCallback((data) => {
    console.log("GameRoom: Game state received:", data);
    setGame(data.game);
    setGameStatus(data.game.status);
  }, []);

  const handlePlayerJoined = useCallback((data) => {
    console.log("GameRoom: Player joined event received:", data);
    toast.success(`${data.user.username} joined the game!`);
    setGame(data.game);
    setGameStatus(data.game.status);
  }, []);

  const handlePlayerLeft = useCallback((data) => {
    toast(`${data.user.username} left the game`);
    setGame(data.game);
    setGameStatus(data.game.status);
  }, []);

  const handleMoveMade = useCallback(
    (data) => {
      setGame(data.game);
      setGameStatus(data.game.status);
      setIsMakingMove(false);

      if (data.game.status === "finished") {
        if (data.game.winner) {
          const isWinner = data.game.winner._id === user.id;
          if (isWinner) {
            toast.success("Congratulations! You won!");
          } else {
            toast.error("You lost! Better luck next time.");
          }
        } else {
          toast("Game ended in a draw!");
        }
      }
    },
    [user]
  );

  const handleMoveError = useCallback((data) => {
    toast.error(data.message);
    setIsMakingMove(false);
  }, []);

  const handleError = useCallback((data) => {
    toast.error(data.message);
  }, []);

  const handleRematchStarted = useCallback((data) => {
    setGame(data.game);
    setGameStatus(data.game.status);
    toast.success("Rematch started!");
  }, []);

  const handleChatMessage = useCallback(
    (data) => {
      console.log("GameRoom: Received chat message:", data);
      console.log("GameRoom: Current user ID:", user?.id);
      console.log("GameRoom: Message sender ID:", data.message.sender.id);
      console.log(
        "GameRoom: Is message from current user?",
        data.message.sender.id === user?.id
      );

      // Add message to chat messages
      setChatMessages((prev) => [...prev, data.message]);

      // Increment unread count if chat is not open
      if (!isChatOpen) {
        setUnreadMessages((prev) => prev + 1);
      }
    },
    [isChatOpen, user?.id]
  );

  const handleMessageReaction = useCallback((data) => {
    console.log("GameRoom: Received message reaction:", data);

    // Update the specific message with the reaction
    setChatMessages((prev) =>
      prev.map((message) => {
        if (message.id === data.messageId) {
          // Initialize reactions array if it doesn't exist
          const reactions = message.reactions || [];

          // Check if this user already reacted to this message
          const existingReactionIndex = reactions.findIndex(
            (r) => r.user.id === data.user.id
          );

          if (existingReactionIndex >= 0) {
            // Update existing reaction
            reactions[existingReactionIndex] = {
              emoji: data.reaction,
              user: data.user,
              timestamp: data.timestamp,
              count: reactions[existingReactionIndex].count + 1,
            };
          } else {
            // Add new reaction
            reactions.push({
              emoji: data.reaction,
              user: data.user,
              timestamp: data.timestamp,
              count: 1,
            });
          }

          return { ...message, reactions };
        }
        return message;
      })
    );
  }, []);

  const handleMessageRead = useCallback((data) => {
    console.log("GameRoom: Received message read receipt:", data);

    // Update the specific message with read receipt
    setChatMessages((prev) =>
      prev.map((message) => {
        if (message.id === data.messageId) {
          // Initialize readBy array if it doesn't exist
          const readBy = message.readBy || [];

          // Check if this user already read this message
          const existingReadIndex = readBy.findIndex(
            (r) => r.id === data.readBy.id
          );

          if (existingReadIndex >= 0) {
            // Update existing read receipt
            readBy[existingReadIndex] = data.readBy;
          } else {
            // Add new read receipt
            readBy.push(data.readBy);
          }

          return { ...message, readBy };
        }
        return message;
      })
    );
  }, []);

  const handleChatToggle = useCallback(() => {
    setIsChatOpen((prev) => {
      if (!prev) {
        setUnreadMessages(0); // Reset unread count when opening chat
      }
      return !prev;
    });
  }, []);

  const handleChatMinimize = useCallback((minimized) => {
    if (!minimized) {
      setUnreadMessages(0); // Reset unread count when maximizing chat
    }
  }, []);

  const setupSocketListeners = useCallback(() => {
    console.log("GameRoom: Setting up socket listeners");
    on(SOCKET_EVENTS.GAME_STATE, handleGameState);
    on(SOCKET_EVENTS.PLAYER_JOINED, handlePlayerJoined);
    on(SOCKET_EVENTS.PLAYER_LEFT, handlePlayerLeft);
    on(SOCKET_EVENTS.MOVE_MADE, handleMoveMade);
    on(SOCKET_EVENTS.MOVE_ERROR, handleMoveError);
    on(SOCKET_EVENTS.REMATCH_STARTED, handleRematchStarted);
    on(SOCKET_EVENTS.CHAT_MESSAGE, handleChatMessage);
    on("message_reaction", handleMessageReaction);
    on("message_read", handleMessageRead);
    on(SOCKET_EVENTS.ERROR, handleError);

    return () => {
      console.log("GameRoom: Cleaning up socket listeners");
      off(SOCKET_EVENTS.GAME_STATE, handleGameState);
      off(SOCKET_EVENTS.PLAYER_JOINED, handlePlayerJoined);
      off(SOCKET_EVENTS.PLAYER_LEFT, handlePlayerLeft);
      off(SOCKET_EVENTS.MOVE_MADE, handleMoveMade);
      off(SOCKET_EVENTS.MOVE_ERROR, handleMoveError);
      off(SOCKET_EVENTS.REMATCH_STARTED, handleRematchStarted);
      off(SOCKET_EVENTS.CHAT_MESSAGE, handleChatMessage);
      off("message_reaction", handleMessageReaction);
      off("message_read", handleMessageRead);
      off(SOCKET_EVENTS.ERROR, handleError);
    };
  }, [on, off]);

  const loadGame = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getGame(roomId);

      if (response.success) {
        setGame(response.data.game);
        setGameStatus(response.data.game.status);

        // Wait for socket to be connected, then join the game room
        const joinRoom = () => {
          console.log("GameRoom: Attempting to join game room:", roomId);
          console.log(
            "GameRoom: Current user:",
            user?.username,
            "ID:",
            user?.id
          );
          console.log("GameRoom: Socket connected:", isConnected);
          emit(SOCKET_EVENTS.JOIN_GAME, { roomId });
        };

        // Join the game room immediately if socket is connected
        if (isConnected) {
          console.log(
            "GameRoom: Socket is connected, joining room immediately"
          );
          joinRoom();
        } else {
          // Wait for socket to be ready before joining
          let attempts = 0;
          const maxAttempts = 10; // 2 seconds max wait for socket
          const waitForSocketAndJoin = () => {
            attempts++;
            if (isConnected) {
              console.log("GameRoom: Socket is connected, joining room");
              joinRoom();
            } else if (attempts < maxAttempts) {
              console.log(
                `GameRoom: Socket not connected yet, waiting... (${attempts}/${maxAttempts})`
              );
              setTimeout(waitForSocketAndJoin, 200);
            } else {
              console.warn(
                "GameRoom: Socket connection timeout, trying to join anyway"
              );
              joinRoom();
            }
          };

          // Start the process
          setTimeout(waitForSocketAndJoin, 100);
        }
      } else {
        toast.error("Game not found");
        navigate("/");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Please log in again");
        navigate("/login");
      } else if (error.response?.status === 403) {
        toast.error("You don't have access to this game");
        navigate("/");
      } else {
        toast.error("Failed to load game");
        navigate("/");
      }
    } finally {
      setIsLoading(false);
    }
  }, [roomId, emit, navigate]);

  useEffect(() => {
    if (!roomId) {
      navigate("/");
      return;
    }

    // Check if user is authenticated
    if (!user) {
      navigate("/login");
      return;
    }

    // Prevent multiple socket setups using ref
    if (socketSetupRef.current) {
      console.log("GameRoom: Socket already set up, skipping...");
      return;
    }

    console.log("GameRoom: Setting up socket connection...");
    socketSetupRef.current = true;

    // Connect to socket first
    console.log("GameRoom: About to call connectSocket()");
    connectSocket();
    console.log("GameRoom: connectSocket() called successfully");

    // Test socket connection after a short delay
    setTimeout(() => {
      console.log("GameRoom: Testing socket connection:", {
        socketExists: !!socket,
        socketConnected: socket?.connected,
        isConnected: isConnected,
      });
    }, 2000);

    loadGame();
    const cleanup = setupSocketListeners();

    return () => {
      console.log("GameRoom: Cleaning up socket connection...");
      socketSetupRef.current = false;
      // Clean up socket listeners
      if (cleanup) {
        cleanup();
      }
      // Leave game room on unmount
      if (roomId) {
        emit(SOCKET_EVENTS.LEAVE_GAME, { roomId });
      }
      // Disconnect socket
      if (socketRef.current) {
        console.log("GameRoom: Disconnecting socket...");
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [
    roomId,
    user,
    navigate,
    connectSocket,
    loadGame,
    setupSocketListeners,
    emit,
  ]);

  // Separate useEffect for fallback mechanism
  useEffect(() => {
    if (!game || game.status !== "waiting") return;

    console.log("GameRoom: Setting up fallback refresh for waiting game");
    const refreshInterval = setInterval(() => {
      console.log("GameRoom: Refreshing game state (fallback)");
      loadGame();
    }, 10000); // Refresh every 10 seconds if still waiting (less frequent)

    return () => {
      console.log("GameRoom: Clearing fallback refresh");
      clearInterval(refreshInterval);
    };
  }, [game?.status, loadGame]);

  const makeMove = useCallback(
    async (row, col) => {
      if (!game || game.status !== "active" || isMakingMove) {
        return;
      }

      try {
        setIsMakingMove(true);
        // Emit move via socket only - the server will handle the move logic
        emit(SOCKET_EVENTS.MAKE_MOVE, { row, col });
      } catch (error) {
        toast.error("Failed to make move");
        setIsMakingMove(false);
      }
    },
    [game, isMakingMove, emit]
  );

  const rematch = () => {
    // Emit rematch event via socket
    emit(SOCKET_EVENTS.REMATCH, { roomId });
  };

  const leaveGame = () => {
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading game..." />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Game Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The game you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/")}>Back to Lobby</Button>
        </Card>
      </div>
    );
  }

  const isPlayer1 = game.player1._id === user.id;
  const isPlayer2 = game.player2 && game.player2._id === user.id;
  const isCurrentPlayer =
    game.currentPlayer && game.currentPlayer._id === user.id;
  const isWinner = game.winner && game.winner._id === user.id;
  const isDraw = game.status === "finished" && !game.winner;


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
            variant="outline"
            onClick={leaveGame}
            className="flex items-center space-x-2 bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Lobby</span>
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              Game Room
            </h1>
            <div className="flex items-center justify-center space-x-3 mt-3">
              <span className="text-sm text-gray-600 font-medium">
                Room ID:
              </span>
              <span className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-mono text-xl font-bold shadow-lg">
                {roomId}
              </span>
            </div>
          </div>
          <div className="w-32" /> {/* Spacer */}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Player 1 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <PlayerCard
              player={game.player1}
              isCurrentPlayer={
                isCurrentPlayer && game.player1._id === game.currentPlayer._id
              }
              isWinner={isWinner && isPlayer1}
              symbol="X"
            />
          </motion.div>

          {/* Game Board */}
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GameBoard
              game={game}
              currentUserId={user.id}
              onMove={makeMove}
              disabled={isMakingMove || gameStatus !== "active"}
            />

            {/* Game Status */}
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {gameStatus === "waiting" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-6 h-6 text-yellow-600 animate-pulse" />
                      <p className="text-lg font-semibold text-yellow-800">
                        {!game.player2
                          ? "Waiting for player 2 to join..."
                          : "Waiting for game to start..."}
                      </p>
                    </div>
                    {!game.player2 && (
                      <p className="text-sm text-yellow-700 text-center">
                        Share the room code{" "}
                        <span className="font-mono font-bold">
                          {game.roomId}
                        </span>{" "}
                        with another player
                      </p>
                    )}
                  </div>
                </div>
              )}
              {gameStatus === "active" && (
                <div
                  className={`rounded-xl p-6 ${
                    isCurrentPlayer
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-3">
                    {isCurrentPlayer && (
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                    <p
                      className={`text-lg font-semibold ${
                        isCurrentPlayer ? "text-green-800" : "text-gray-700"
                      }`}
                    >
                      {isCurrentPlayer
                        ? "Your turn"
                        : game.currentPlayer?.username
                        ? `${game.currentPlayer.username}'s turn`
                        : "Waiting for turn..."}
                    </p>
                  </div>
                </div>
              )}
              {gameStatus === "finished" && (
                <div className="text-center">
                  {isWinner ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center justify-center space-x-3 text-green-600">
                        <Trophy className="w-8 h-8" />
                        <span className="text-2xl font-bold">You Won!</span>
                      </div>
                    </div>
                  ) : isDraw ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                      <p className="text-2xl font-semibold text-gray-700">
                        It's a Draw!
                      </p>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                      <p className="text-2xl font-semibold text-red-700">
                        You Lost!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Game Actions */}
            {gameStatus === "finished" && (
              <motion.div
                className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  variant="primary"
                  onClick={rematch}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="font-semibold">Play Again</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={leaveGame}
                  className="flex items-center justify-center space-x-2 bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 px-8 py-3"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-semibold">Leave Game</span>
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Player 2 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {game.player2 ? (
              <PlayerCard
                player={game.player2}
                isCurrentPlayer={
                  isCurrentPlayer && game.player2._id === game.currentPlayer._id
                }
                isWinner={isWinner && isPlayer2}
                symbol="O"
              />
            ) : (
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-gray-400">?</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Waiting for Player
                </h3>
                <p className="text-sm text-gray-500">
                  Another player will join soon
                </p>
              </Card>
            )}
          </motion.div>
        </div>

        {/* Game Info */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold text-sm">M</span>
                </div>
                <p className="text-sm text-gray-500 mb-1">Moves</p>
                <p className="text-xl font-bold text-gray-800">
                  {game.moves.length}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm text-gray-500 mb-1">Duration</p>
                <p className="text-xl font-bold text-gray-800">
                  {game.duration
                    ? `${Math.floor(game.duration / 60)}:${(game.duration % 60)
                        .toString()
                        .padStart(2, "0")}`
                    : "0:00"}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    game.status === "active"
                      ? "bg-green-100"
                      : game.status === "finished"
                      ? "bg-blue-100"
                      : "bg-yellow-100"
                  }`}
                >
                  <span
                    className={`font-bold text-sm ${
                      game.status === "active"
                        ? "text-green-600"
                        : game.status === "finished"
                        ? "text-blue-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {game.status === "active"
                      ? "A"
                      : game.status === "finished"
                      ? "F"
                      : "W"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <p className="text-xl font-bold text-gray-800 capitalize">
                  {game.status}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-primary-600 font-bold text-sm">#</span>
                </div>
                <p className="text-sm text-gray-500 mb-1">Room ID</p>
                <p className="text-xl font-bold font-mono text-primary-600">
                  {roomId}
                </p>
              </div>
            </div>

            {/* Player Statistics */}
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                Your Statistics
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold text-sm">G</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Games Played</p>
                  <p className="text-xl font-bold text-gray-800">
                    {user?.gamesPlayed || 0}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-green-600 font-bold text-sm">W</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Games Won</p>
                  <p className="text-xl font-bold text-green-600">
                    {user?.gamesWon || 0}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-purple-600 font-bold text-sm">%</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Win Rate</p>
                  <p className="text-xl font-bold text-purple-600">
                    {user?.winRate || 0}%
                  </p>
                </div>
              </div>
            </motion.div>
          </Card>
        </motion.div>
      </div>

      {/* Chat Toggle Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 1 }}
      >
        <ChatToggle
          isOpen={isChatOpen}
          onToggle={handleChatToggle}
          unreadCount={unreadMessages}
        />
      </motion.div>

      {/* Chat Box */}
      <ChatBox
        isOpen={isChatOpen}
        onToggle={handleChatToggle}
        onMinimize={handleChatMinimize}
        roomId={roomId}
        messages={chatMessages}
        // Pass socket functions from GameRoom
        emit={emit}
        on={on}
        off={off}
        isConnected={isConnected}
      />
    </div>
  );
};

export default GameRoom;

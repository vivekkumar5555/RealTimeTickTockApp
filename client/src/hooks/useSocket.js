import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

/**
 * Custom hook for managing Socket.IO connection
 * @returns {Object} Socket connection utilities
 */
export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const connectingRef = useRef(false);

  /**
   * Connect to the socket server
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    if (connectingRef.current) {
      return;
    }

    connectingRef.current = true;

    // Clean up existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socketUrl = "https://realtimeticktockappserver-93we.onrender.com";

    try {
      const newSocket = io(socketUrl, {
        transports: ["websocket", "polling"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      console.log("Socket created:", {
        socketExists: !!newSocket,
        socketConnected: newSocket?.connected,
        socketId: newSocket?.id,
      });

      if (!newSocket) {
        throw new Error("Socket creation returned null/undefined");
      }

      newSocket.on("connect", () => {
        console.log("Socket connected successfully");
        console.log("Socket ID:", newSocket.id);
        setIsConnected(true);
        connectingRef.current = false;

        // Authenticate with token
        const token = localStorage.getItem("token");
        if (token) {
          console.log("Authenticating socket...");
          newSocket.emit("authenticate", { token });
        }
      });

      newSocket.on("connecting", () => {
        console.log("Socket is connecting...");
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        setIsConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        console.error("Error details:", {
          message: error.message,
          description: error.description,
          context: error.context,
          type: error.type,
        });
        setIsConnected(false);
        connectingRef.current = false;
        // Don't automatically retry - let the socket's built-in reconnection handle it
      });

      newSocket.on("reconnect", (attemptNumber) => {
        console.log("Socket reconnected after", attemptNumber, "attempts");
        setIsConnected(true);
        connectingRef.current = false;
      });

      newSocket.on("reconnect_error", (error) => {
        console.error("Socket reconnection error:", error);
        setIsConnected(false);
        connectingRef.current = false;
      });

      newSocket.on("reconnect_failed", () => {
        console.error("Socket reconnection failed after all attempts");
        setIsConnected(false);
        connectingRef.current = false;
      });

      newSocket.on("authenticated", (data) => {
        console.log("Socket authenticated successfully");
      });

      newSocket.on("auth_error", (error) => {
        console.error("Socket authentication failed:", error);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      console.log("Socket created and assigned to ref:", {
        socketExists: !!socketRef.current,
        socketConnected: socketRef.current?.connected,
        socketId: socketRef.current?.id,
      });

      console.log("Socket state after assignment:", {
        refExists: !!socketRef.current,
        stateSocket: !!socket,
        isConnected: isConnected,
      });
    } catch (error) {
      console.error("Failed to create socket:", error);
      connectingRef.current = false;
      setIsConnected(false);
    }
  }, []);

  /**
   * Disconnect from the socket server
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  const emit = useCallback(
    (event, data) => {
      console.log("useSocket: Emit called with event:", event);
      console.log("useSocket: Socket connected:", socketRef.current?.connected);
      console.log("useSocket: Socket exists:", !!socketRef.current);

      if (socketRef.current?.connected) {
        console.log("useSocket: Emitting message to server");
        socketRef.current.emit(event, data);
      } else {
        console.log(
          "useSocket: Socket not connected, attempting to connect..."
        );
        // Try to connect if not already connecting
        if (!connectingRef.current) {
          connect();
        }

        // Try to emit immediately if socket exists, otherwise wait
        if (socketRef.current) {
          console.log(
            "useSocket: Socket exists but not connected, trying to emit anyway"
          );
          socketRef.current.emit(event, data);
        } else {
          console.warn("useSocket: No socket available, message lost");
        }
      }
    },
    [connect]
  );

  /**
   * Listen to an event from the server
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const returnValue = {
    socket,
    isConnected,
    connect,
    disconnect,
    emit,
    on,
    off,
  };

  console.log("=== useSocket returning ===", {
    socketExists: !!returnValue.socket,
    isConnected: returnValue.isConnected,
    connectExists: !!returnValue.connect,
    emitExists: !!returnValue.emit,
  });

  return returnValue;
};

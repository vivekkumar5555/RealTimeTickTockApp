import React, { createContext, useContext, useReducer, useEffect } from "react";
import apiClient from "../utils/api";
import { toast } from "react-hot-toast";

const AuthContext = createContext(undefined);

/**
 * Auth action types
 */
const AUTH_ACTIONS = {
  AUTH_START: "AUTH_START",
  AUTH_SUCCESS: "AUTH_SUCCESS",
  AUTH_FAILURE: "AUTH_FAILURE",
  LOGOUT: "LOGOUT",
  UPDATE_USER: "UPDATE_USER",
};

/**
 * Auth reducer
 * @param {Object} state - Current state
 * @param {Object} action - Action object
 * @returns {Object} New state
 */
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.AUTH_START:
      return {
        ...state,
        isLoading: true,
      };
    case AUTH_ACTIONS.AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case AUTH_ACTIONS.AUTH_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

/**
 * AuthProvider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          dispatch({
            type: AUTH_ACTIONS.AUTH_SUCCESS,
            payload: { user, token },
          });
        } catch (error) {
          console.error("Error parsing stored user data:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          dispatch({ type: AUTH_ACTIONS.AUTH_FAILURE });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.AUTH_FAILURE });
      }
    };

    initAuth();
  }, []);

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - Email address
   * @param {string} credentials.password - Password
   */
  const login = async (credentials) => {
    try {
      console.log("=== AUTH CONTEXT LOGIN ===");
      console.log("AuthContext: Starting login process");
      console.log("AuthContext: Credentials received:", credentials);
      dispatch({ type: AUTH_ACTIONS.AUTH_START });

      console.log("AuthContext: Calling apiClient.login...");
      const response = await apiClient.login(credentials);
      console.log("AuthContext: API response received", response);

      if (response.success && response.data) {
        const { user, token } = response.data;
        console.log("AuthContext: User data extracted:", { user, token });

        // Store in localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        console.log("AuthContext: User data stored in localStorage");

        dispatch({ type: AUTH_ACTIONS.AUTH_SUCCESS, payload: { user, token } });
        console.log("AuthContext: AUTH_SUCCESS dispatched");
        toast.success(`Welcome back, ${user.username}!`);
      } else {
        console.log("AuthContext: Login failed - invalid response:", response);
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      console.error("=== AUTH CONTEXT LOGIN ERROR ===");
      console.error("AuthContext: Login error", error);
      console.error("AuthContext: Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });
      dispatch({ type: AUTH_ACTIONS.AUTH_FAILURE });
      const message =
        error.response?.data?.message || error.message || "Login failed";
      toast.error(message);
      throw error;
    }
  };

  /**
   * Register user
   * @param {Object} credentials - Registration credentials
   * @param {string} credentials.username - Username
   * @param {string} credentials.email - Email address
   * @param {string} credentials.password - Password
   */
  const register = async (credentials) => {
    try {
      console.log("=== AUTH CONTEXT REGISTER ===");
      console.log("AuthContext: Starting registration process");
      console.log("AuthContext: Credentials received:", credentials);
      dispatch({ type: AUTH_ACTIONS.AUTH_START });

      console.log("AuthContext: Calling apiClient.register...");
      const response = await apiClient.register(credentials);
      console.log("AuthContext: API response received", response);

      if (response.success && response.data) {
        const { user, token } = response.data;
        console.log("AuthContext: User data extracted:", { user, token });

        // Store in localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        console.log("AuthContext: User data stored in localStorage");

        dispatch({ type: AUTH_ACTIONS.AUTH_SUCCESS, payload: { user, token } });
        console.log("AuthContext: AUTH_SUCCESS dispatched");
        toast.success(`Welcome to Tic-Tac-Toe, ${user.username}!`);
      } else {
        console.log(
          "AuthContext: Registration failed - invalid response:",
          response
        );
        throw new Error(response.message || "Registration failed");
      }
    } catch (error) {
      console.error("=== AUTH CONTEXT REGISTER ERROR ===");
      console.error("AuthContext: Registration error", error);
      console.error("AuthContext: Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });
      dispatch({ type: AUTH_ACTIONS.AUTH_FAILURE });
      const message =
        error.response?.data?.message || error.message || "Registration failed";
      toast.error(message);
      throw error;
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.success("Logged out successfully");
    }
  };

  /**
   * Update user data
   * @param {Object} user - Updated user object
   */
  const updateUser = (user) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: user });
    localStorage.setItem("user", JSON.stringify(user));
  };

  /**
   * Refresh user data from server
   */
  const refreshUser = async () => {
    try {
      console.log("AuthContext: Refreshing user data from server...");
      const response = await apiClient.getMe();

      if (response.success && response.data) {
        const user = response.data;
        console.log("AuthContext: User data refreshed:", user);

        // Update context and localStorage
        updateUser(user);
        toast.success("Profile updated!");
        return user;
      } else {
        throw new Error(response.message || "Failed to refresh user data");
      }
    } catch (error) {
      console.error("AuthContext: Error refreshing user data:", error);
      toast.error("Failed to refresh profile data");
      throw error;
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

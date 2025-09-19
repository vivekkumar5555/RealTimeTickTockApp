import axios from "axios";

/**
 * API Client for Tic-Tac-Toe application
 * Handles all HTTP requests to the backend
 */
class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Register a new user
   * @param {Object} credentials - Registration credentials
   * @param {string} credentials.username - Username
   * @param {string} credentials.email - Email address
   * @param {string} credentials.password - Password
   * @returns {Promise<Object>} API response with user data and token
   */
  async register(credentials) {
    const response = await this.client.post("/auth/register", credentials);
    return response.data;
  }

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - Email address
   * @param {string} credentials.password - Password
   * @returns {Promise<Object>} API response with user data and token
   */
  async login(credentials) {
    const response = await this.client.post("/auth/login", credentials);
    return response.data;
  }

  /**
   * Get current user data
   * @returns {Promise<Object>} API response with user data
   */
  async getMe() {
    const response = await this.client.get("/auth/me");
    return response.data;
  }

  /**
   * Logout user
   * @returns {Promise<Object>} API response
   */
  async logout() {
    const response = await this.client.post("/auth/logout");
    return response.data;
  }

  /**
   * Create a new game
   * @returns {Promise<Object>} API response with game data
   */
  async createGame() {
    console.log("API Client: Creating game...");
    try {
      const response = await this.client.post("/games");
      console.log("API Client: Game creation response:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Client: Game creation error:", error);
      throw error;
    }
  }

  /**
   * Join an existing game
   * @param {string} roomId - Room ID to join
   * @returns {Promise<Object>} API response with game data
   */
  async joinGame(roomId) {
    const response = await this.client.post(`/games/${roomId}/join`);
    return response.data;
  }

  /**
   * Get game by room ID
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} API response with game data
   */
  async getGame(roomId) {
    console.log("API Client: Getting game with roomId:", roomId);
    try {
      const response = await this.client.get(`/games/${roomId}`);
      console.log("API Client: Get game response:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Client: Get game error:", error);
      console.error("API Client: Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
      throw error;
    }
  }

  /**
   * Make a move in the game
   * @param {string} roomId - Room ID
   * @param {number} row - Row index (0-2)
   * @param {number} col - Column index (0-2)
   * @returns {Promise<Object>} API response with updated game data
   */
  async makeMove(roomId, row, col) {
    const response = await this.client.post(`/games/${roomId}/move`, {
      row,
      col,
    });
    return response.data;
  }

  /**
   * Start a rematch in the same room
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} API response with reset game data
   */
  async rematch(roomId) {
    const response = await this.client.post(`/games/${roomId}/rematch`);
    return response.data;
  }

  /**
   * Get user's game history
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise<Object>} API response with paginated game data
   */
  async getUserGames(page = 1, limit = 10) {
    const response = await this.client.get(
      `/games/user/history?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  /**
   * Health check endpoint
   * @returns {Promise<Object>} API response
   */
  async healthCheck() {
    const response = await this.client.get("/health");
    return response.data;
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;

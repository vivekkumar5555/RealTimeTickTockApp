/**
 * Type definitions and JSDoc comments for the Tic-Tac-Toe app
 * This file provides type safety through JSDoc comments
 */

/**
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} username - Username
 * @property {string} email - Email address
 * @property {number} eloRating - ELO rating
 * @property {number} gamesPlayed - Total games played
 * @property {number} gamesWon - Games won
 * @property {number} gamesLost - Games lost
 * @property {number} gamesDrawn - Games drawn
 * @property {number} winRate - Win rate percentage
 * @property {boolean} [isOnline] - Online status
 * @property {string} [lastActive] - Last active timestamp
 */

/**
 * @typedef {Object} Move
 * @property {string} player - Player ID
 * @property {Object} position - Move position
 * @property {number} position.row - Row index (0-2)
 * @property {number} position.col - Column index (0-2)
 * @property {string} timestamp - Move timestamp
 */

/**
 * @typedef {Object} Game
 * @property {string} _id - Game ID
 * @property {string} roomId - Room ID
 * @property {User} player1 - First player
 * @property {User} [player2] - Second player
 * @property {User} [currentPlayer] - Current player
 * @property {string[][]} board - Game board (3x3)
 * @property {'waiting'|'active'|'finished'|'abandoned'} status - Game status
 * @property {User} [winner] - Winner player
 * @property {Move[]} moves - Game moves
 * @property {string} startTime - Game start time
 * @property {string} [endTime] - Game end time
 * @property {number} [duration] - Game duration in seconds
 * @property {string} createdAt - Creation timestamp
 * @property {string} updatedAt - Update timestamp
 */

/**
 * @typedef {Object} AuthState
 * @property {User|null} user - Current user
 * @property {string|null} token - Auth token
 * @property {boolean} isAuthenticated - Authentication status
 * @property {boolean} isLoading - Loading status
 */

/**
 * @typedef {Object} LoginCredentials
 * @property {string} email - Email address
 * @property {string} password - Password
 */

/**
 * @typedef {Object} RegisterCredentials
 * @property {string} username - Username
 * @property {string} email - Email address
 * @property {string} password - Password
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Success status
 * @property {string} message - Response message
 * @property {*} [data] - Response data
 * @property {Array} [errors] - Validation errors
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {boolean} success - Success status
 * @property {Object} data - Response data
 * @property {Array} data.items - Items array
 * @property {Object} data.pagination - Pagination info
 * @property {number} data.pagination.current - Current page
 * @property {number} data.pagination.pages - Total pages
 * @property {number} data.pagination.total - Total items
 */

/**
 * @typedef {Object} GameBoardProps
 * @property {Game} game - Game object
 * @property {string} currentUserId - Current user ID
 * @property {function} onMove - Move handler function
 * @property {boolean} [disabled] - Disabled state
 */

/**
 * @typedef {Object} GameCellProps
 * @property {string} value - Cell value (X, O, or empty)
 * @property {number} row - Row index
 * @property {number} col - Column index
 * @property {boolean} [isWinning] - Winning cell indicator
 * @property {function} onClick - Click handler
 * @property {boolean} [disabled] - Disabled state
 */

/**
 * @typedef {Object} PlayerCardProps
 * @property {User} player - Player object
 * @property {boolean} [isCurrentPlayer] - Current player indicator
 * @property {boolean} [isWinner] - Winner indicator
 * @property {'X'|'O'|null} symbol - Player symbol
 */

/**
 * @typedef {Object} GameHistoryProps
 * @property {Game[]} games - Games array
 * @property {string} currentUserId - Current user ID
 * @property {function} [onGameSelect] - Game selection handler
 */

/**
 * @typedef {Object} Notification
 * @property {string} id - Notification ID
 * @property {'success'|'error'|'warning'|'info'} type - Notification type
 * @property {string} title - Notification title
 * @property {string} message - Notification message
 * @property {number} [duration] - Display duration
 */

// Game status constants
export const GAME_STATUS = {
  WAITING: "waiting",
  ACTIVE: "active",
  FINISHED: "finished",
  ABANDONED: "abandoned",
};

// Player symbols
export const PLAYER_SYMBOLS = {
  X: "X",
  O: "O",
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    ME: "/auth/me",
    LOGOUT: "/auth/logout",
  },
  GAMES: {
    CREATE: "/games",
    JOIN: (roomId) => `/games/${roomId}/join`,
    GET: (roomId) => `/games/${roomId}`,
    MOVE: (roomId) => `/games/${roomId}/move`,
    HISTORY: "/games/user/history",
  },
  HEALTH: "/health",
};

// Socket events
export const SOCKET_EVENTS = {
  // Client to server
  AUTHENTICATE: "authenticate",
  JOIN_GAME: "join_game",
  LEAVE_GAME: "leave_game",
  MAKE_MOVE: "make_move",
  REMATCH: "rematch",
  SEND_CHAT_MESSAGE: "send_chat_message",

  // Server to client
  AUTHENTICATED: "authenticated",
  AUTH_ERROR: "auth_error",
  GAME_STATE: "game_state",
  PLAYER_JOINED: "player_joined",
  PLAYER_LEFT: "player_left",
  PLAYER_DISCONNECTED: "player_disconnected",
  MOVE_MADE: "move_made",
  MOVE_ERROR: "move_error",
  REMATCH_STARTED: "rematch_started",
  CHAT_MESSAGE: "chat_message",
  CHAT_ERROR: "chat_error",
  ERROR: "error",
};

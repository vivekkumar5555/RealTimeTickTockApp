# Real-time Tic-Tac-Toe Game

A beautiful, real-time multiplayer Tic-Tac-Toe game built with the MERN stack and WebSockets. Features ELO ranking system, beautiful UI with animations, and real-time gameplay.

## 🚀 Features

- **Real-time Multiplayer**: Play with friends in real-time using Socket.IO
- **Beautiful UI**: Modern, responsive design with smooth animations
- **ELO Ranking System**: Competitive ranking system to track player skill
- **User Authentication**: Secure JWT-based authentication
- **Game History**: Track your games and statistics
- **Responsive Design**: Works perfectly on desktop and mobile
- **Live Updates**: Real-time game state updates and notifications

## 🛠️ Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend

- **React** - UI library
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## 📦 Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### 1. Clone the repository

```bash
git clone <repository-url>
cd RealTimeTickTockApp
```

### 2. Install dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Setup

Create a `.env` file in the `server` directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tic-tac-toe
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

### 4. Start the application

#### Development Mode (Recommended)

```bash
# From the root directory
npm run dev
```

This will start both the server and client concurrently.

#### Manual Start

```bash
# Start the server
cd server
npm run dev

# Start the client (in a new terminal)
cd client
npm start
```

## 🎮 How to Play

1. **Register/Login**: Create an account or sign in
2. **Create Game**: Click "Create New Game" to start a new game
3. **Join Game**: Enter a room ID to join an existing game
4. **Play**: Make moves by clicking on the board
5. **Win**: Get three in a row to win the game!

## 🏗️ Project Structure

```
RealTimeTickTockApp/
├── server/                 # Backend code
│   ├── config/            # Database configuration
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── socket/           # Socket.IO handlers
│   ├── utils/            # Utility functions
│   └── server.js         # Server entry point
├── client/               # Frontend code
│   ├── public/           # Static files
│   └── src/
│       ├── components/   # React components
│       ├── context/      # React context
│       ├── hooks/        # Custom hooks
│       ├── pages/        # Page components
│       ├── types/        # Type definitions
│       └── utils/        # Utility functions
└── package.json          # Root package.json
```

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Games

- `POST /api/games` - Create new game
- `POST /api/games/:roomId/join` - Join game
- `GET /api/games/:roomId` - Get game details
- `POST /api/games/:roomId/move` - Make move
- `GET /api/games/user/history` - Get user's game history

## 🎨 UI Components

- **Button**: Customizable button with variants and animations
- **Input**: Form input with validation states
- **Card**: Glass morphism card component
- **GameBoard**: Interactive game board
- **PlayerCard**: Player information display
- **LoadingSpinner**: Animated loading indicator

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet.js security headers

## 🚀 Deployment

### Environment Variables

Make sure to set the following environment variables in production:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRE=7d
CORS_ORIGIN=your-frontend-url
```

### Build for Production

```bash
# Build the client
cd client
npm run build

# Start the server
cd ../server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- Framer Motion for animations
- Tailwind CSS for styling
- React community for excellent documentation

---

**Happy Gaming! 🎮**

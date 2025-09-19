const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    console.log("Auth middleware: Checking authentication for", req.method, req.path);
    const authHeader = req.headers["authorization"];
    console.log("Auth middleware: Authorization header:", authHeader);
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    console.log("Auth middleware: Extracted token:", token ? "Present" : "Missing");

    if (!token) {
      console.log("Auth middleware: No token provided");
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Auth middleware: Token decoded successfully, userId:", decoded.userId);
    const user = await User.findById(decoded.userId).select("-password");
    console.log("Auth middleware: User found:", user ? "Yes" : "No");

    if (!user) {
      console.log("Auth middleware: User not found for userId:", decoded.userId);
      return res.status(401).json({
        success: false,
        message: "Invalid token - user not found",
      });
    }

    req.user = user;
    console.log("Auth middleware: Authentication successful for user:", user.username);
    next();
  } catch (error) {
    console.log("Auth middleware: Error occurred:", error.name, error.message);
    if (error.name === "JsonWebTokenError") {
      console.log("Auth middleware: Invalid JWT token");
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      console.log("Auth middleware: Token expired");
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during authentication",
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");
      req.user = user;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken,
};

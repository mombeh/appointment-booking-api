// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    logger.warn(`Auth middleware: No token provided`);
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.user.id,
      role: decoded.user.role // Now includes the role from the token
    };
    logger.debug(`Auth middleware: Token verified for user ID ${req.user.id}, role: ${req.user.role}`);
    next();
  } catch (err) {
    logger.error('Auth middleware: Token verification failed', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    }
    return res.status(500).json({ message: "Token verification error" });
  }
};

export default authMiddleware;

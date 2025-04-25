//middlewares/authmiddleware

import jwt from "jsonwebtoken"
import logger from "../utils/logger.js"

const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization")
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;


  if (!token) {
    logger.warn(`Auth middleware: no token provided`)
    return res.status(401).json({ message: 'No token, authorication has been denied' })
  }
  try {
    const decoded = jwt.decode(token, process.env.JWT_SECRET)
    req.user = decoded.user
    logger.debug(`Auth middleware: Token verified for user ID ${req.user.id}`)
    next()
  } catch (err) {
    logger.error('Auth middleware: token verification failed', err)
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token is expired" })
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Token is not valid" })
    }
    return res.status(err.status || 500).json({ message: err.message || "server error during token verification" })
  }

}

export default authMiddleware

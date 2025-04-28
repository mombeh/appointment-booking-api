//routes/users.js

import express from 'express';
import authMiddleware from '../middlewares/authmiddleware.js';
import logger from '../utils/logger.js';
const router = express.Router();

/* GET users listing. */
router.get('/me', authMiddleware, (req, res, next) => {
  logger.info('Fetching current user data for:', req.user);
  return res.json({ user: req.user })
});


export default router;

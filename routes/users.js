import express from 'express';
import authMiddleware from '../middlewares/authmiddleware';
import logger from '../utils/logger';
const router = express.Router();

/* GET users listing. */
router.get('/', authMiddleware,(req, res, next) => {
  logger.info('Fetching current user data for:', req.user);
  return res.json({ user: req.user })
});

router.patch('')

module.exports = router;

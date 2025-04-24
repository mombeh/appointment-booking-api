import express from 'express';
import authMiddleware from '../middlewares/authmiddleware';
const router = express.Router();

/* GET home page. */
router.get('/', authMiddleware, function(req, res, next) {
  res.sent('index', { title: 'Express' });
});

export default router;

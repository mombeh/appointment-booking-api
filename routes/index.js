//routes/index

import express from 'express';
 import authMiddleware from '../middlewares/authmiddleware.js';
const router = express.Router();

/* GET home page. */
router.get('/test', authMiddleware, function(req, res, next) {
  res.send( 'Welcome to the API' );
});

export default router;

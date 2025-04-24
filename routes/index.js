import express from 'express';
const router = express.Router();

import { connectToDb } from "./config/db.js";
import { initializeDbSchema } from "./config/schema.js";

await connectToDb();
await initializeDbSchema();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

export default router;

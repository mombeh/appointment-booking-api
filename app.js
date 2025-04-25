//app.js

import createError from 'http-errors';
import express from 'express';
import { fileURLToPath } from 'node:url';
import path, {dirname} from 'node:path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import winstonLogger from "./utils/logger.js"

import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';

const app = express();

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const morganFormat = process.env.NODE_ENV === "production" ? "dev" : 'combined'
app.use(morgan(morganFormat, { stream: winstonLogger.stream }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});



export default app;

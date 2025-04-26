//app.js

import createError from 'http-errors';
import express from 'express';
import { fileURLToPath } from 'node:url';
import path, {dirname} from 'node:path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import winstonLogger from "./utils/logger.js"
import timeSlotRoutes from "./routes/timeSlot.js"
import indexRouter from './routes/index.js';
import appointmentRoutes from './routes/appointments.js'
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
app.use('/time-slot', timeSlotRoutes);
app.use('/appointments', appointmentRoutes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next(createError(404));
});



export default app;

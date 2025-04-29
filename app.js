//app.js
import createError from 'http-errors';
import express from 'express';
import { fileURLToPath } from 'node:url';
import path, {dirname} from 'node:path';
import cookieParser from 'cookie-parser';
// import swaggerUi from "swagger-ui-express"
// import swaggerSpec from './swaggerConfig.js';
import morgan from 'morgan';
import authRouter from "./routes/auth.js"
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
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/time-slot', timeSlotRoutes);
app.use('/api/appointments', appointmentRoutes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


export default app;

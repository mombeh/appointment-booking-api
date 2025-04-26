import express from 'express';
import { bookAppointment, viewMyAppointments, viewProviderAppointments, cancelAppointment } from '../controllers/appointmentController.js';
import authMiddleware from '../middleware/authMiddleware.js'; // assuming you have this middleware

const router = express.Router();

// Middleware to protect all appointment routes
router.use(authMiddleware);

// Routes
router.post('/book', bookAppointment);
router.get('/my', viewMyAppointments);
router.get('/provider', viewProviderAppointments);
router.patch('/:appointmentId/cancel', cancelAppointment);

export default router;

import express from 'express';
import createTimeSlotHandler from '../controllers/timeSlot-controller.js';
import authMiddleware from '../middlewares/authmiddleware.js';
import { viewTimeSlotsHandler } from '../controllers/timeSlot-controller.js';
import { updateTimeSlotHandler } from '../controllers/timeSlot-controller.js';
import { deleteTimeSlotHandler } from '../controllers/timeSlot-controller.js';
import { viewAvailableSlotsHandler } from '../controllers/timeSlot-controller.js';
const router = express.Router();

// Route to create a time slot (only accessible by service providers)
router.post('/create', authMiddleware, createTimeSlotHandler);
router.get('/view', authMiddleware, viewTimeSlotsHandler);
router.put('/update', authMiddleware, updateTimeSlotHandler);
router.delete('/delete/:id', authMiddleware, deleteTimeSlotHandler);
router.get('/available', viewAvailableSlotsHandler);


export default router;

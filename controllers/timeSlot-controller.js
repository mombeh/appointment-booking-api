

import { query } from '../config/db.js';
import logger from '../utils/logger.js';

export default async function createTimeSlotHandler(req, res, next) {
  const { date, start_time, end_time, provider_id } = req.body;
  try {
    const providerCheckQuery = 'SELECT id FROM service_providers WHERE id = $1';
    const providerCheckResult = await query(providerCheckQuery, [provider_id]);

    if (providerCheckResult.rowCount === 0) {
      return res.status(404).json({ message: 'Service provider not found' });
    }

    const insertSql = `
      INSERT INTO time_slots (provider_id, date, start_time, end_time)
      VALUES ($1, $2, $3, $4)
      RETURNING id, provider_id, date, start_time, end_time
    `;
    const newTimeSlotResult = await query(insertSql, [provider_id, date, start_time, end_time]);

    const newTimeSlot = newTimeSlotResult.rows[0];
    logger.info(`Time slot created successfully: ${newTimeSlot.id}`);

    return res.status(201).json({
      message: 'Time slot created successfully',
      timeSlot: newTimeSlot
    });
  } catch (error) {
    logger.error('Error during time slot creation:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

export async function viewTimeSlotsHandler(req, res, next) {
  const providerId = req.user.id;  // Assuming the provider's ID is in the JWT payload
  
  try {
    const selectSql = 'SELECT * FROM time_slots WHERE provider_id = $1';
    const result = await query(selectSql, [providerId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No time slots found for this provider' });
    }

    return res.status(200).json({ timeSlots: result.rows });
  } catch (error) {
    logger.error('Error retrieving time slots:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

export async function updateTimeSlotHandler(req, res, next) {
  const { id, start_time, end_time } = req.body;
  const providerId = req.user.id;  // Assuming provider's ID is in JWT
  
  try {
    const checkSlotQuery = 'SELECT * FROM time_slots WHERE id = $1 AND provider_id = $2';
    const slotCheck = await query(checkSlotQuery, [id, providerId]);

    if (slotCheck.rowCount === 0) {
      return res.status(404).json({ message: 'Time slot not found or not owned by provider' });
    }

    const updateSql = `
      UPDATE time_slots
      SET start_time = $1, end_time = $2
      WHERE id = $3
      RETURNING id, start_time, end_time
    `;
    const updatedSlot = await query(updateSql, [start_time, end_time, id]);

    return res.status(200).json({
      message: 'Time slot updated successfully',
      timeSlot: updatedSlot.rows[0]
    });
  } catch (error) {
    logger.error('Error updating time slot:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

export async function deleteTimeSlotHandler(req, res, next) {
  const { id } = req.params;
  const providerId = req.user.id;

  try {
    const checkSlotQuery = 'SELECT * FROM time_slots WHERE id = $1 AND provider_id = $2';
    const slotCheck = await query(checkSlotQuery, [id, providerId]);

    if (slotCheck.rowCount === 0) {
      return res.status(404).json({ message: 'Time slot not found or not owned by provider' });
    }

    const deleteSql = 'DELETE FROM time_slots WHERE id = $1';
    await query(deleteSql, [id]);

    return res.status(200).json({ message: 'Time slot deleted successfully' });
  } catch (error) {
    logger.error('Error deleting time slot:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

export async function viewAvailableSlotsHandler(req, res, next) {
  const { provider_id, date } = req.query;  // Client selects provider and date
  
  try {
    const selectSql = `
      SELECT * FROM time_slots 
      WHERE provider_id = $1 AND date = $2 AND is_booked = FALSE
    `;
    const result = await query(selectSql, [provider_id, date]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No available time slots for this provider on the selected date' });
    }

    return res.status(200).json({ availableSlots: result.rows });
  } catch (error) {
    logger.error('Error retrieving available time slots:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}


  
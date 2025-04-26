import { query } from '../config/db.js'; // Your database connection
import logger from '../utils/logger.js'; 

// Book Appointment
export const bookAppointment = async (req, res) => {
    try {
        const { slotId, providerId, serviceId } = req.body;
        const clientId = req.user.id;

        if (!slotId || !providerId) {
            return res.status(400).json({ message: 'Slot ID and Provider ID are required.' });
        }

        // Check if slot is available
        const slotResult = await query('SELECT * FROM slots WHERE id = $1 AND is_booked = FALSE', [slotId]);
        if (slotResult.rowCount === 0) {
            return res.status(400).json({ message: 'Selected time slot is not available.' });
        }

        // Create appointment
        const appointmentResult = await query(`
            INSERT INTO appointments (client_id, provider_id, service_id, slot_id, status)
            VALUES ($1, $2, $3, $4, 'booked')
            RETURNING *
        `, [clientId, providerId, serviceId || null, slotId]);

        // Mark slot as booked
        await query('UPDATE slots SET is_booked = TRUE WHERE id = $1', [slotId]);

        res.status(201).json({ message: 'Appointment booked successfully.', appointment: appointmentResult.rows[0] });
    } catch (error) {
        logger.error('Error booking appointment:', error);
        res.status(500).json({ message: 'Server error while booking appointment.' });
    }
};

// View My Appointments (Client)
export const viewMyAppointments = async (req, res) => {
    try {
        const clientId = req.user.id;

        const appointments = await query(`
            SELECT * FROM appointments 
            WHERE client_id = $1
        `, [clientId]);

        res.status(200).json(appointments.rows);
    } catch (error) {
        logger.error('Error fetching client appointments:', error);
        res.status(500).json({ message: 'Server error while fetching appointments.' });
    }
};

// View Provider Appointments
export const viewProviderAppointments = async (req, res) => {
    try {
        const providerId = req.user.id;

        const appointments = await query(`
            SELECT * FROM appointments 
            WHERE provider_id = $1
        `, [providerId]);

        res.status(200).json(appointments.rows);
    } catch (error) {
        logger.error('Error fetching provider appointments:', error);
        res.status(500).json({ message: 'Server error while fetching provider appointments.' });
    }
};

// Cancel Appointment
export const cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const userId = req.user.id;

        // Get the appointment
        const appointmentResult = await query('SELECT * FROM appointments WHERE id = $1', [appointmentId]);

        if (appointmentResult.rowCount === 0) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        const appointment = appointmentResult.rows[0];

        // Check if user is owner (client) or provider
        if (appointment.client_id !== userId && appointment.provider_id !== userId) {
            return res.status(403).json({ message: 'Unauthorized to cancel this appointment.' });
        }

        // Update appointment to canceled
        await query('UPDATE appointments SET status = $1 WHERE id = $2', ['canceled', appointmentId]);

        // Free the slot
        await query('UPDATE slots SET is_booked = FALSE WHERE id = $1', [appointment.slot_id]);

        res.status(200).json({ message: 'Appointment canceled successfully.' });
    } catch (error) {
        logger.error('Error canceling appointment:', error);
        res.status(500).json({ message: 'Server error while canceling appointment.' });
    }
};

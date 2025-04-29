import pg from "pg"
import logger from "../utils/logger.js"
import "dotenv/config"

const { Pool } = pg

const {
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_NAME,
  DB_PORT,
  DB_NAME_TEST,
  NODE_ENV
} = process.env

if (!DB_HOST || !DB_PASSWORD || !DB_NAME || !DB_USER || !DB_PORT || !DB_NAME_TEST) {
  logger.error("Database environment variable are missing! Check your .env file.")
  process.exit(1)
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.NODE_ENV === "test" ? DB_NAME_TEST : DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(DB_PORT, 10),
  connectionTimeoutMillis: 2000
})
logger.info(`Database is configured for: ${DB_NAME}`)

pool.on("connect", (client) => {
  logger.info(`Client connected from Pool (Total count: ${pool.totalCount})`)
})

pool.on("error", (err, client) => {
  logger.error('Unexpected error on idle client in pool', err)
  process.exit(-1)
})

const initializeDbSchema = async () => {
  const client = await pool.connect();
  try {
    logger.info("Initializing database schema...");

    // pgcrypto for UUIDs
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    logger.info('pgcrypto extension ensured');

    // Users Table (Clients)
    await client.query(`
       CREATE TABLE IF NOT EXISTS users (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         first_name VARCHAR(100) NOT NULL,
         last_name VARCHAR(100) NOT NULL,
         email VARCHAR(255) UNIQUE NOT NULL,
         password VARCHAR(255) NOT NULL,
         created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
       );
     `);
    logger.info('Users table has been created')

    // Service Providers Table (Simplified)
    await client.query(`
        CREATE TABLE IF NOT EXISTS service_providers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        service_type VARCHAR(100),
        email VARCHAR(255) UNIQUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.info('service_provider table has been created')

    // Time Slots Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS time_slots (
        id SERIAL PRIMARY KEY,
        provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_booked BOOLEAN DEFAULT FALSE
      );
    `);
    logger.info('time_slots table has been created')

    // Appointments Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
        appointment_time TIMESTAMPTZ NOT NULL,
        status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, cancelled, completed
        notes TEXT,
        time_slot_id UUID REFERENCES time_slots(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.info('appointments table has been created');

    // Create indexes after both tables are ready
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON appointments(provider_id)`);
    // await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_time_slot_id ON appointments(time_slot_id)`);
    logger.info('Indexes created');

    // Pre-configured some service providers
    await client.query(`
      INSERT INTO service_providers (name, service_type, email)
      VALUES 
        ('Dr. Alice Smith', 'Dermatologist', 'alice@clinic.com'),
        ('Dr. Bob Johnson', 'Therapist', 'bob@therapycenter.com')
      ON CONFLICT (email) DO NOTHING;
    `);
    logger.info('Pre-configured providers inserted');

    // Triggers and other functions
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    logger.debug('update_updated_at_column function ensured.');

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_time_slots_updated_at') THEN
          CREATE TRIGGER update_time_slots_updated_at
          BEFORE UPDATE ON time_slots
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$;
    `);
    logger.debug("Time_slots update_at Trigger is checked and created");

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
          CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$;
    `);
    logger.debug("Users update_at Trigger is checked and created");

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_appointments_updated_at') THEN
          CREATE TRIGGER update_appointments_updated_at
          BEFORE UPDATE ON appointments
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$;
    `);
    logger.debug("Appointments update_at Trigger is checked and created");

  } catch (error) {
    logger.error(`Error while initializing the schema`, error);
    process.exit(1);
  } finally {
    client.release();
  }
}

const connectToDb = async () => {
  try {
    const client = await pool.connect()
    logger.info(`Database connection pool established successfully`)
    client.release()
  } catch (error) {
    logger.error('Unable to establish database connection pool', error)
    process.exit(1)
  }
}

const query = async (text, params) => {
  const start = Date.now()
  try {
    const response = await pool.query(text, params)
    const duration = Date.now() - start;
    logger.info(`Executed query: { text: ${text.substring(0, 100)}..., params: ${JSON.stringify(params)}, duration: ${duration}ms, rows: ${response.rowCount}}`);
    return response
  } catch (error) {
    logger.error(`Error executing query: { text: ${text.substring(0, 100)}..., params: ${JSON.stringify(params)}, error: ${error.message}}`);
    throw error
  }
}

// Exporting the functions
export { pool, connectToDb, query, initializeDbSchema }

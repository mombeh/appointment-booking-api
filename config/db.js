import { pool } from "./db.js";
import logger from "../utils/logger.js";

const initializeDbSchema = async () => {
  const client = await pool.connect();
  try {
    logger.info("Initializing database schema...");

    // pgcrypto for UUIDs
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

    // Users Table (Clients)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

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

    // Appointments Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
        appointment_time TIMESTAMPTZ NOT NULL,
        status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, cancelled, completed
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Update updated_at column automatically
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Triggers
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

    // Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON appointments(provider_id)`);

    logger.info("Database schema initialized successfully.");
  } catch (error) {
    logger.error("Failed to initialize schema", error);
    process.exit(1);
  } finally {
    client.release();
  }
};

export { initializeDbSchema };

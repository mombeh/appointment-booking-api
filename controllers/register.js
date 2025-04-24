import { query } from "../config/db.js";
import logger from "../utils/logger.js";
import bcrypt from "bcryptjs"

const HASH_SALT = 10

export default async function registerHandler(req, res, next) {
  const { firstName, lastName, email, password } = req.body
  try {
    const userCheckQuery = 'SELECT email FROM users WHERE email = $1';
    const userCheckResult = await query(userCheckQuery, [email])

    if (userCheckResult.rows.length > 0) {
      logger.warn(`Registrationg attempt failed: Email already exists - ${email}`)
      return res.status(409).json({ message: "Email already in use" })
    }
    const passwordHash = await bcrypt.hash(password, HASH_SALT)
    logger.debug(`Password hashed for email: ${email}`)

    const insertSql = `INSERT INTO users (first_name, last_name, email, password) 
                        VALUES($1,$2,$3,$4)
                        RETURNING id`
    const newUserResult = await query(insertSql, [firstName, lastName, email, passwordHash])

    const newUser = newUserResult.rows[0]
    logger.info(`User registered successfully: ${newUser.id}`)

    return res.status(201).json({
      message: "User registered successfully",
      userId: {
        id: newUser.id
      }
    })
  } catch (error) {
    logger.error(`Error during user registration for ${email}: `, error)
    next(error)
  }
}

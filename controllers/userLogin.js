import { query } from "../config/db.js"
import logger from "../utils/logger.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export default async function loginHandler(req, res, next) {
  const { email, password } = req.body
  try {

    const findUserSQL = `SELECT id, email, first_name, last_name, password FROM users WHERE email = $1`
    const userResult = await query(findUserSQL, [email])

    if (userResult.rowCount === 0) {
      logger.warn(`Login attempt failed: User not found - ${email}`)
      return res.status(401).json({ message: 'Invalid Credentials' })
    }
    const user = userResult.rows[0]

    const isPassswordMatch = await bcrypt.compare(password, user.password)

    if (!isPassswordMatch) {
      logger.warn(`Login attempt failed: Incorrect password - ${email}`)
      return res.status(401).json({ message: "Invalid password" })
    }
    const payload = {
      user: {
        id: user.id,
        email: user.email
      }
    }
    jwt.sign(payload, process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN
      }, (err, token) => {
        if (err) {
          logger.error(`Error generating JWT for ${email}: `, err)
          throw new Error('Error generating authentication toke')
        }
        logger.info(`User logged in successfully: ${email} (ID: ${user.id})`)
        res.json({
          message: "Login Successfull!",
          token: token,
          user: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email
          }
        })
      })
  } catch (error) {
    logger.error(`Error during login process for ${email}: `, error)
    res.status(500).json({ message: error.message || "Server error during login" })
  }
}

import express from "express"
import { loginValidator, validate } from "../validator/auth-validator.js"
import registerHandler from "../controllers/register-controller.js"
import loginHandler from "../controllers/userLogin-controller.js"
const router = express.Router()


router.post("/register", validate, registerHandler)


router.post("/login", loginValidator, loginHandler)


export default router

import Joi from "joi";

const registerValidator = Joi.object({
  email: Joi.string().email({ maxDomainSegments: 2 }).required(),
  firstName: Joi.string().min(3).max(30).required(),
  lastName: Joi.string().min(3).max(30).required(),
  password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9@_!#]{3,30}$')).required(),
  confirmPassword: Joi.valid(Joi.ref('password')).required(),

  // Added for provider support
  role: Joi.string().valid('user', 'provider').required(),
  serviceType: Joi.string().optional().allow('', null)
});

export const validate = (req, res, next) => {
  const { error } = registerValidator.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

const loginSchema = Joi.object({
  email: Joi.string().email({ maxDomainSegments: 2 }).required(),
  password: Joi.string().required(),
});

export const loginValidator = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

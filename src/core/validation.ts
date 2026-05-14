/**
 * Joi validation schemas for the multi-user password manager API
 */

import Joi from 'joi';

// ============ User Registration/Authentication ============
export const userRegistrationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Must be a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .min(12)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.min': 'Password must be at least 12 characters long',
      'string.pattern.base':
        'Password must contain uppercase, lowercase, number, and special character',
      'any.required': 'Password is required',
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords must match',
    'any.required': 'Confirm password is required',
  }),
});

export const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ============ Password Entry ============
export const passwordEntrySchema = Joi.object({
  service: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Service name is required',
    'string.max': 'Service name must be less than 255 characters',
  }),
  username: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Username is required',
    'string.max': 'Username must be less than 255 characters',
  }),
  email: Joi.string().email().optional().allow(''),
  password: Joi.string().min(1).required().messages({
    'string.empty': 'Password is required',
  }),
  url: Joi.string().uri().optional().allow(''),
  notes: Joi.string().max(2000).optional().allow(''),
  tags: Joi.array().items(Joi.string()).optional(),
});

export const passwordUpdateSchema = Joi.object({
  service: Joi.string().min(1).max(255).optional(),
  username: Joi.string().min(1).max(255).optional(),
  email: Joi.string().email().optional().allow(''),
  password: Joi.string().min(1).optional(),
  url: Joi.string().uri().optional().allow(''),
  notes: Joi.string().max(2000).optional().allow(''),
  tags: Joi.array().items(Joi.string()).optional(),
}).min(1);

// ============ Query Validation ============
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional(),
  tags: Joi.string().optional(),
});

// ============ Utility function ============
export const validate = <T>(data: unknown, schema: Joi.Schema): T => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      code: detail.code,
    }));
    throw { errors };
  }

  return value as T;
};

const { z } = require('zod');

const registerSchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username cannot exceed 50 characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
  email: z
    .string()
    .email('Please provide a valid email address')
    .optional()
    .or(z.literal('')),
  role: z
    .enum(['citizen', 'admin', 'department_admin'], {
      invalid_type_error: "Role must be 'citizen', 'admin', or 'department_admin'",
    })
    .default('citizen')
    .optional(),
  phone: z.string().trim().optional().or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
  department: z.string().trim().optional().nullable(),
});

const loginSchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .trim()
    .min(1, 'Username is required'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
};

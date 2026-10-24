const { z } = require('zod');

// Ahmedabad bounding box boundaries
const AHMEDABAD_BOUNDS = {
  minLat: 22.95,
  maxLat: 23.12,
  minLng: 72.45,
  maxLng: 72.66,
};

const createIssueSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(4, 'Title must be at least 4 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(6, 'Description must be at least 6 characters'),
  category: z
    .enum(['roads', 'water', 'electricity', 'sanitation', 'other', 'auto'])
    .optional()
    .default('other'),
  priority: z
    .enum(['low', 'medium', 'high', 'critical', 'auto'])
    .optional()
    .default('medium'),
  latitude: z.coerce
    .number({ required_error: 'Latitude is required' })
    .refine(
      (lat) => lat >= AHMEDABAD_BOUNDS.minLat && lat <= AHMEDABAD_BOUNDS.maxLat,
      {
        message: `Latitude must be within Ahmedabad boundaries (${AHMEDABAD_BOUNDS.minLat} - ${AHMEDABAD_BOUNDS.maxLat})`,
      }
    ),
  longitude: z.coerce
    .number({ required_error: 'Longitude is required' })
    .refine(
      (lng) => lng >= AHMEDABAD_BOUNDS.minLng && lng <= AHMEDABAD_BOUNDS.maxLng,
      {
        message: `Longitude must be within Ahmedabad boundaries (${AHMEDABAD_BOUNDS.minLng} - ${AHMEDABAD_BOUNDS.maxLng})`,
      }
    ),
  department: z.string().trim().optional().nullable(),
  manual_category: z.coerce.boolean().optional().default(false),
  manual_priority: z.coerce.boolean().optional().default(false),
});

const updateIssueSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'resolved']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  department: z.string().trim().optional().nullable(),
  department_notes: z.string().trim().optional(),
  title: z.string().trim().min(4).max(200).optional(),
  description: z.string().trim().min(6).optional(),
});

module.exports = {
  createIssueSchema,
  updateIssueSchema,
  AHMEDABAD_BOUNDS,
};

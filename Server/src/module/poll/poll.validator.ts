import { iso, z } from "zod";

const optionValidator = z.object({
  text: z.string().min(1, "Option text is required").max(500),
  order: z.number().int().min(0),
});

const questionValidator = z.object({
  question: z.string().min(3, "Question too short").max(500),
  isRequired: z.boolean().optional().default(true),
  order: z.number().int().min(0),
  options: z
    .array(optionValidator)
    .min(2, "Each question needs at least 2 options")
    .max(10, "Max 10 options per question")
    .refine((opts) => new Set(opts.map((o) => o.text.toLowerCase())).size === opts.length, {
      message: "Duplicate options are not allowed",
    }),
});

export const createPollValidator = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(120, "Title too long"),
  description: z.string().max(2000).optional(),
  isAnonymous: z.boolean().optional().default(true),
  requireAuth: z.boolean().optional().default(false),
  expiresAt: z
  .coerce
  .date()
  .optional()
  .refine(
    (val) => !val || val > new Date(),
    {
      message: "Expiry date must be in the future",
    }
  ),
  questions: z
    .array(questionValidator)
    .min(1, "At least one question required")
    .max(20, "Max 20 questions per poll"),
});

export const updatePollValidator = z.object({
  title: z.string().min(5).max(120).optional(),
  description: z.string().max(2000).optional(),
  isAnonymous: z.boolean().optional(),
  requireAuth: z.boolean().optional(),
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .refine((val) => !val || new Date(val) > new Date(), {
      message: "Expiry date must be in the future",
    }),
});

export const pollQueryValidator = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  published: z.coerce.boolean().optional(),
  closed: z.coerce.boolean().optional(),
});

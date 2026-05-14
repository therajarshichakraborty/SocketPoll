import { z } from "zod";

export const registerValidator = z.object({
  name: z.string().min(2, "Name too short").max(80),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginValidator = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

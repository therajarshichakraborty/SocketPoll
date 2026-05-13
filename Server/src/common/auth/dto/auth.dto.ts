import { z } from "zod";

export const registerDto = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});
export type RegisterDto = z.infer<typeof registerDto>;
export const loginDto = z.object({
  identifier: z.string().min(1, "Email or username is required"),  // email OR username
  password: z.string().min(1, "Password is required"),
});
export type LoginDto = z.infer<typeof loginDto>;
export const forgotPasswordDto = z.object({
  email: z.string().email("Invalid email address"),
});
export type ForgotPasswordDto = z.infer<typeof forgotPasswordDto>;
export const resetPasswordDto = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});
export type ResetPasswordDto = z.infer<typeof resetPasswordDto>;
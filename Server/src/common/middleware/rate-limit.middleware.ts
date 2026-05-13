import { rateLimit } from "express-rate-limit";
import { env } from "../config/env.config";

export const loginRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: "draft-7",   
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
  skip: () => env.NODE_ENV === "test",  
});
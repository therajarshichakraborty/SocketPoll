import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError, UnauthorizedError } from "../utils/api.error";
import { env } from "../config/env.config";

const JWT_SECRET = env.JWT_ACCESS_SECRET;

interface JWTPayload {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
// ✅ Return null instead of throwing
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return null; // ← return null, don't throw
  }
  return authHeader.split(" ")[1];
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next(new UnauthorizedError("No token provided")); // ← authenticate still throws

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

export function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req); // ← now safely returns null
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      req.user = payload;
    } catch {
    }
  }
  next();
}
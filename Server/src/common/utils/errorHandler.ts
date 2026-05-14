import { Request, Response, NextFunction } from "express";
import { ApiError } from "./api.error";
import { ZodError } from "zod";

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      errors: err.errors.map((e: any) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Known app errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
  }

  // Unknown errors
  console.error("[Unhandled Error]", err);
  return res.status(500).json({
    success: false,
    code: "INTERNAL_ERROR",
    message: "Something went wrong",
  });
}

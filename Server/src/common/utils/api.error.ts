export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 400, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 422);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409);
  }
}

// utils/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import logger from "./logger";

// Error types for better classification
export enum ErrorType {
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMIT = "RATE_LIMIT",
  DATABASE = "DATABASE",
  NETWORK = "NETWORK",
  INTERNAL = "INTERNAL",
}

// Error classification function
export const classifyError = (error: any): ErrorType => {
  if (error instanceof mongoose.Error.ValidationError)
    return ErrorType.VALIDATION;
  if (error instanceof mongoose.Error.CastError) return ErrorType.VALIDATION;
  if (error instanceof mongoose.Error) {
    if ((error as any).code === 11000) return ErrorType.CONFLICT;
    return ErrorType.DATABASE;
  }
  if (error instanceof APIError) {
    switch (error.statusCode) {
      case HttpStatus.BAD_REQUEST:
        return ErrorType.VALIDATION;
      case HttpStatus.UNAUTHORIZED:
        return ErrorType.AUTHENTICATION;
      case HttpStatus.FORBIDDEN:
        return ErrorType.AUTHORIZATION;
      case HttpStatus.NOT_FOUND:
        return ErrorType.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorType.CONFLICT;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorType.RATE_LIMIT;
      default:
        return ErrorType.INTERNAL;
    }
  }
  return ErrorType.INTERNAL;
};

// Enhanced error handler
export const handleError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errorType = classifyError(error);
  const isDevelopment = process.env.NODE_ENV === "development";

  let customError: APIError;
  let shouldLog = true;

  // Handle different types of errors
  switch (errorType) {
    case ErrorType.VALIDATION:
      customError = handleValidationError(error);
      shouldLog = false; // Don't log validation errors
      break;

    case ErrorType.AUTHENTICATION:
      customError = handleAuthenticationError(error);
      shouldLog = false; // Don't log auth errors
      break;

    case ErrorType.AUTHORIZATION:
      customError = handleAuthorizationError(error);
      shouldLog = false; // Don't log auth errors
      break;

    case ErrorType.NOT_FOUND:
      customError = handleNotFoundError(error);
      shouldLog = false; // Don't log not found errors
      break;

    case ErrorType.CONFLICT:
      customError = handleConflictError(error);
      shouldLog = false; // Don't log conflict errors
      break;

    case ErrorType.RATE_LIMIT:
      customError = handleRateLimitError(error);
      shouldLog = false; // Don't log rate limit errors
      break;

    case ErrorType.DATABASE:
      customError = handleDatabaseError(error);
      shouldLog = true; // Log database errors
      break;

    case ErrorType.NETWORK:
      customError = handleNetworkError(error);
      shouldLog = true; // Log network errors
      break;

    default:
      customError = handleInternalError(error);
      shouldLog = true; // Log internal errors
      break;
  }

  // Log error with context
  if (shouldLog) {
    logError(customError, req, error);
  }

  // Send error response
  sendErrorResponse(res, customError, isDevelopment);
};

// Handle validation errors
const handleValidationError = (error: any): APIError => {
  // If it's already an APIError with BAD_REQUEST status, return it as-is
  if (
    error instanceof APIError &&
    error.statusCode === HttpStatus.BAD_REQUEST
  ) {
    return error;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const validationErrors = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
      value: err.value,
    }));

    const errorMessage = validationErrors
      .map((err) => `${err.field}: ${err.message}`)
      .join(", ");

    return new APIError(
      `Validation failed: ${errorMessage}`,
      HttpStatus.BAD_REQUEST,
      { validationErrors }
    );
  }

  if (error instanceof mongoose.Error.CastError) {
    return new APIError(
      `Invalid ${error.path}: ${error.value}`,
      HttpStatus.BAD_REQUEST,
      { field: error.path, value: error.value }
    );
  }

  return new APIError("Validation failed", HttpStatus.BAD_REQUEST, error);
};

// Handle authentication errors
const handleAuthenticationError = (error: any): APIError => {
  if (error instanceof APIError) return error;

  return new APIError("Authentication failed", HttpStatus.UNAUTHORIZED, error);
};

// Handle authorization errors
const handleAuthorizationError = (error: any): APIError => {
  if (error instanceof APIError) return error;

  return new APIError("Insufficient permissions", HttpStatus.FORBIDDEN, error);
};

// Handle not found errors
const handleNotFoundError = (error: any): APIError => {
  if (error instanceof APIError) return error;

  return new APIError("Resource not found", HttpStatus.NOT_FOUND, error);
};

// Handle conflict errors
const handleConflictError = (error: any): APIError => {
  if (error instanceof mongoose.Error && (error as any).code === 11000) {
    const field = Object.keys((error as any).keyPattern)[0];
    const message = field
      ? `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      : "A resource with this value already exists.";

    return new APIError(message, HttpStatus.CONFLICT, { duplicateField: field });
  }

  if (error instanceof APIError) return error;

  return new APIError("Resource conflict", HttpStatus.CONFLICT, error);
};

// Handle rate limit errors
const handleRateLimitError = (error: any): APIError => {
  if (error instanceof APIError) return error;

  return new APIError("Too many requests", HttpStatus.TOO_MANY_REQUESTS, error);
};

// Handle database errors
const handleDatabaseError = (error: any): APIError => {
  logger.error("Database error:", error);

  return new APIError(
    "Database operation failed",
    HttpStatus.INTERNAL_SERVER_ERROR,
    error
  );
};

// Handle network errors
const handleNetworkError = (error: any): APIError => {
  logger.error("Network error:", error);

  return new APIError(
    "Network error occurred",
    HttpStatus.INTERNAL_SERVER_ERROR,
    error
  );
};

// Handle internal errors
const handleInternalError = (error: any): APIError => {
  logger.error("Internal server error:", error);

  return new APIError(
    "Internal server error",
    HttpStatus.INTERNAL_SERVER_ERROR,
    error
  );
};

// Log error with context
const logError = (error: APIError, req: Request, originalError: any) => {
  const logData = {
    error: {
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
      userId: req.user?.id || req.admin?.id,
      body: req.body,
      query: req.query,
      params: req.params,
    },
    timestamp: new Date().toISOString(),
    originalError:
      originalError instanceof Error
        ? {
            name: originalError.name,
            message: originalError.message,
            stack: originalError.stack,
          }
        : originalError,
  };

  logger.error(`${error.message} - ${req.method} ${req.originalUrl}`, logData);
};

// Send error response
const sendErrorResponse = (
  res: Response,
  error: APIError,
  isDevelopment: boolean
) => {
  const errorResponse: any = {
    success: false,
    message: error.message,
    timestamp: new Date().toISOString(),
    errorType: classifyError(error).toLowerCase(),
  };

  // Add validation errors if present
  if (
    error.details &&
    typeof error.details === "object" &&
    "validationErrors" in error.details
  ) {
    errorResponse.validationErrors = error.details.validationErrors;
  }

  // Add additional details in development
  if (isDevelopment && error.details) {
    errorResponse.details = error.details;
  }

  res.status(error.statusCode).json(errorResponse);
};

// Async error handler wrapper
export const asyncErrorHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      handleError(error, req, res, next);
    });
  };
};

// Error response helper
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  details?: any
) => {
  const error = new APIError(message, statusCode, details);
  sendErrorResponse(res, error, process.env.NODE_ENV === "development");
};

// Success response helper
export const sendSuccess = (
  res: Response,
  message: string,
  data?: any,
  statusCode: number = HttpStatus.OK
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

// Validation error response helper
export const sendValidationError = (
  res: Response,
  errors: Array<{ field: string; message: string; value?: any }>
) => {
  const errorMessage = errors
    .map((error) => `${error.field}: ${error.message}`)
    .join(", ");

  const apiError = new APIError(
    `Validation failed: ${errorMessage}`,
    HttpStatus.BAD_REQUEST,
    { validationErrors: errors }
  );

  sendErrorResponse(res, apiError, process.env.NODE_ENV === "development");
};

export default {
  handleError,
  asyncErrorHandler,
  sendError,
  sendSuccess,
  sendValidationError,
  classifyError,
};

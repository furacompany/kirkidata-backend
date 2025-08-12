// error/error.global.ts
import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import APIError from "./APIError";
import { HttpStatus } from "../constants/httpStatus.constant";

const isDevelopment = process.env.NODE_ENV === "development";

const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let customError: APIError;

  // Handle different types of errors
  if (err instanceof APIError) {
    customError = err;
  } else if (err instanceof Error) {
    // Convert generic errors to APIError
    const message = err.message || "An error occurred";
    const statusCode = err.message.includes("validation") || 
                      err.message.includes("required") || 
                      err.message.includes("invalid") 
                      ? HttpStatus.BAD_REQUEST 
                      : HttpStatus.INTERNAL_SERVER_ERROR;
    
    customError = new APIError(message, statusCode, err);
  } else {
    // Handle unknown errors
    customError = new APIError("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR, err);
  }

  const { statusCode, message, details } = customError;

  // Log error with context
  logger.error(`${message} - ${req.method} ${req.originalUrl}`, {
    error: {
      message: customError.message,
      statusCode: customError.statusCode,
      details: customError.details,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
      userId: req.user?.id || req.admin?.id,
    },
    timestamp: new Date().toISOString(),
  });

  // Send error response
  const errorResponse: any = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  // Add validation errors if present
  if (details && typeof details === "object" && "validationErrors" in details) {
    errorResponse.validationErrors = details.validationErrors;
  }

  // Add additional details in development
  if (isDevelopment && details) {
    errorResponse.details = details;
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;

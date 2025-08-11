// error/error.global.ts
import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import APIError from "./APIError";

const isDevelopment = process.env.NODE_ENV === "development";

const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let customError =
    err instanceof APIError
      ? err
      : new APIError("Internal Server Error", 500, err);

  const { statusCode, message, details } = customError;

  logger.error(`${message} - ${req.method} ${req.originalUrl}`, details);

  res.status(statusCode).json({
    success: false,
    message,
    details: isDevelopment ? details : undefined,
  });
};

export default errorHandler;

// middleware/logSuccess.ts

import { Request, Response, NextFunction } from "express";
import successLogger from "../utils/successLogger";

export const logSuccess = (req: Request, res: Response, next: NextFunction) => {
  const oldSend = res.send;

  res.send = function (body?: any): Response {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      successLogger.info(`${req.method} ${req.originalUrl} ${res.statusCode}`);
    }
    // @ts-ignore
    return oldSend.apply(res, arguments);
  };

  next();
};

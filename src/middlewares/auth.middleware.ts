import { Request, Response, NextFunction } from "express";
import {
  verifyAccessToken,
  verifyAdminAccessToken,
  extractTokenFromRequest,
  isTokenInvalidatedByLogout,
} from "../configs/jwt";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import logger from "../utils/logger";
import UserModel from "../models/user.model";
import AdminModel from "../models/admin.model";

// Extend Request interface to include user/admin information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        phone?: string;
        role: "user" | "admin" | "super_admin";
      };
      admin?: {
        id: string;
        email: string;
        phone: string;
        role: "admin" | "super_admin";
      };
    }
  }
}

// Middleware to authenticate user tokens
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromRequest(req);

    if (!token) {
      throw new APIError("Access token is required", HttpStatus.UNAUTHORIZED);
    }

    try {
      const payload = verifyAccessToken(token);

      if (payload.type !== "access") {
        throw new APIError("Invalid token type", HttpStatus.UNAUTHORIZED);
      }

      if (payload.role !== "user") {
        throw new APIError(
          "Access denied. User role required.",
          HttpStatus.FORBIDDEN
        );
      }

      // Check if token is invalidated by logout
      const user = await UserModel.findById(payload.id);
      if (!user) {
        throw new APIError("User not found", HttpStatus.UNAUTHORIZED);
      }

      // Check if user account is still active
      if (!user.isActive) {
        throw new APIError("Account is deactivated", HttpStatus.FORBIDDEN);
      }

      if (isTokenInvalidatedByLogout(payload, user.lastLogoutAt)) {
        throw new APIError(
          "Token invalidated due to logout",
          HttpStatus.UNAUTHORIZED
        );
      }

      req.user = {
        id: payload.id,
        email: payload.email,
        ...(payload.phone && { phone: payload.phone }),
        role: payload.role,
      };

      next();
    } catch (jwtError) {
      logger.error("JWT verification failed:", jwtError);
      throw new APIError(
        "Invalid or expired access token",
        HttpStatus.UNAUTHORIZED
      );
    }
  } catch (error) {
    next(error);
  }
};

// Middleware to authenticate admin tokens
export const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromRequest(req);

    if (!token) {
      throw new APIError("Access token is required", HttpStatus.UNAUTHORIZED);
    }

    try {
      const payload = verifyAdminAccessToken(token);

      if (payload.type !== "access") {
        throw new APIError("Invalid token type", HttpStatus.UNAUTHORIZED);
      }

      if (payload.role !== "admin" && payload.role !== "super_admin") {
        throw new APIError(
          "Access denied. Admin role required.",
          HttpStatus.FORBIDDEN
        );
      }

      // Check if token is invalidated by logout
      const admin = await AdminModel.findById(payload.id);
      if (!admin) {
        throw new APIError("Admin not found", HttpStatus.UNAUTHORIZED);
      }

      // Check if admin account is still active
      if (!admin.isActive) {
        throw new APIError("Account is deactivated", HttpStatus.FORBIDDEN);
      }

      if (isTokenInvalidatedByLogout(payload, admin.lastLogoutAt)) {
        throw new APIError(
          "Token invalidated due to logout",
          HttpStatus.UNAUTHORIZED
        );
      }

      req.admin = {
        id: payload.id,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
      };

      next();
    } catch (jwtError) {
      logger.error("JWT verification failed:", jwtError);
      throw new APIError(
        "Invalid or expired access token",
        HttpStatus.UNAUTHORIZED
      );
    }
  } catch (error) {
    next(error);
  }
};

// Middleware to authenticate super admin tokens
export const authenticateSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromRequest(req);

    if (!token) {
      throw new APIError("Access token is required", HttpStatus.UNAUTHORIZED);
    }

    try {
      const payload = verifyAdminAccessToken(token);

      if (payload.type !== "access") {
        throw new APIError("Invalid token type", HttpStatus.UNAUTHORIZED);
      }

      if (payload.role !== "super_admin") {
        throw new APIError(
          "Access denied. Super admin role required.",
          HttpStatus.FORBIDDEN
        );
      }

      // Check if token is invalidated by logout
      const admin = await AdminModel.findById(payload.id);
      if (!admin) {
        throw new APIError("Admin not found", HttpStatus.UNAUTHORIZED);
      }

      // Check if admin account is still active
      if (!admin.isActive) {
        throw new APIError("Account is deactivated", HttpStatus.FORBIDDEN);
      }

      if (isTokenInvalidatedByLogout(payload, admin.lastLogoutAt)) {
        throw new APIError(
          "Token invalidated due to logout",
          HttpStatus.UNAUTHORIZED
        );
      }

      req.admin = {
        id: payload.id,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
      };

      next();
    } catch (jwtError) {
      logger.error("JWT verification failed:", jwtError);
      throw new APIError(
        "Invalid or expired access token",
        HttpStatus.UNAUTHORIZED
      );
    }
  } catch (error) {
    next(error);
  }
};

// Middleware to check if user is active
export const checkUserActive = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new APIError("User not authenticated", HttpStatus.UNAUTHORIZED);
    }

    // You can add additional checks here if needed
    // For example, check if the user is still active in the database

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check if admin is active
export const checkAdminActive = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.admin) {
      throw new APIError("Admin not authenticated", HttpStatus.UNAUTHORIZED);
    }

    // You can add additional checks here if needed
    // For example, check if the admin is still active in the database

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to require super admin role
export const requireSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.admin) {
      throw new APIError("Admin not authenticated", HttpStatus.UNAUTHORIZED);
    }

    if (req.admin.role !== "super_admin") {
      throw new APIError(
        "Access denied. Super admin role required.",
        HttpStatus.FORBIDDEN
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

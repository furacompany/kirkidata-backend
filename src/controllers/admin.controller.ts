import { Request, Response, NextFunction } from "express";
import adminService from "../services/admin.service";
import { validateSchema } from "../validations/admin.validation";
import { adminProfileUpdateSchema, adminPasswordChangeSchema } from "../validations/admin.validation";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import logger from "../utils/logger";
import { getStringParam } from "../utils/request";

class AdminController {
  // Update admin profile
  async updateAdminProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { adminId } = req.params;
      const profileData = req.body;

      // Phone number can be changed by admins (but email cannot)

      // Validate request body
      const validatedData = validateSchema(
        adminProfileUpdateSchema,
        profileData
      );

      // Resolve to guaranteed string
      let targetAdminId: string;
      const adminIdStr = getStringParam(adminId);
      if (adminIdStr) {
        targetAdminId = adminIdStr;
      } else if (req.admin?.id) {
        targetAdminId = req.admin.id;
      } else {
        throw new APIError("Admin ID is required", HttpStatus.BAD_REQUEST);
      }

      // Get the admin ID of the person making the update
      const updatedBy = req.admin?.id;
      if (!updatedBy) {
        throw new APIError("Unauthorized", HttpStatus.UNAUTHORIZED);
      }

      // Update admin profile
      const updatedAdmin = await adminService.updateAdminProfile(
        targetAdminId,
        validatedData,
        updatedBy
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Admin profile updated successfully",
        data: updatedAdmin,
      });
    } catch (error) {
      next(error);
    }
  }

  // Change admin password
  async changeAdminPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { adminId } = req.params;
      const { currentPassword, newPassword } = req.body;

      // Validate request body using schema
      const validationResult = validateSchema(adminPasswordChangeSchema, {
        currentPassword,
        newPassword,
      });

      if (validationResult.error) {
        const errorMessage = validationResult.error.details?.[0]?.message || "Validation failed";
        throw new APIError(errorMessage, HttpStatus.BAD_REQUEST);
      }

      // Resolve to guaranteed string
      let targetAdminId: string;
      const adminIdStr = getStringParam(adminId);
      if (adminIdStr) {
        targetAdminId = adminIdStr;
      } else if (req.admin?.id) {
        targetAdminId = req.admin.id;
      } else {
        throw new APIError("Admin ID is required", HttpStatus.BAD_REQUEST);
      }

      // Change admin password
      const result = await adminService.changeAdminPassword(
        targetAdminId,
        currentPassword,
        newPassword
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Admin password changed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current admin profile
  async getCurrentAdminProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const adminId = req.admin?.id;
      if (!adminId) {
        throw new APIError("Unauthorized", HttpStatus.UNAUTHORIZED);
      }

      // Get admin profile
      const admin = await adminService.getAdminById(adminId);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Admin profile retrieved successfully",
        data: admin,
      });
    } catch (error) {
      next(error);
    }
  }

  // Health check endpoint
  async healthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Admin service is healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();

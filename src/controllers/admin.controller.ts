import { Request, Response, NextFunction } from "express";
import adminService from "../services/admin.service";
import { validateSchema } from "../validations/admin.validation";
import {
  adminProfileUpdateSchema,
  adminSearchSchema,
  adminBulkOperationSchema,
  adminStatsSchema,
} from "../validations/admin.validation";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import logger from "../utils/logger";

class AdminController {
  // Get admin by ID
  async getAdminById(req: Request, res: Response, next: NextFunction) {
    try {
      const { adminId } = req.params;

      if (!adminId) {
        throw new APIError("Admin ID is required", HttpStatus.BAD_REQUEST);
      }

      // Get admin by ID
      const admin = await adminService.getAdminById(adminId);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Admin retrieved successfully",
        data: admin,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get admin by email
  async getAdminByEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.params;

      if (!email) {
        throw new APIError("Email is required", HttpStatus.BAD_REQUEST);
      }

      // Get admin by email
      const admin = await adminService.getAdminByEmail(email);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Admin retrieved successfully",
        data: admin,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update admin profile
  async updateAdminProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { adminId } = req.params;
      const profileData = req.body;

      // Validate request body
      const validatedData = validateSchema(
        adminProfileUpdateSchema,
        profileData
      );

      // Resolve to guaranteed string
      let targetAdminId: string;
      if (adminId) {
        targetAdminId = adminId;
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

      if (!currentPassword || !newPassword) {
        throw new APIError(
          "Current password and new password are required",
          HttpStatus.BAD_REQUEST
        );
      }

      // Resolve to guaranteed string
      let targetAdminId: string;
      if (adminId) {
        targetAdminId = adminId;
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

  // Search and filter admins
  async searchAdmins(req: Request, res: Response, next: NextFunction) {
    try {
      const queryParams = req.query;

      // Convert string values to appropriate types
      const filters = {
        ...queryParams,
        page: queryParams.page
          ? parseInt(queryParams.page as string)
          : undefined,
        limit: queryParams.limit
          ? parseInt(queryParams.limit as string)
          : undefined,
        role: queryParams.role as "admin" | "super_admin" | undefined,
        isActive: queryParams.isActive
          ? queryParams.isActive === "true"
          : undefined,
        startDate: queryParams.startDate
          ? new Date(queryParams.startDate as string)
          : undefined,
        endDate: queryParams.endDate
          ? new Date(queryParams.endDate as string)
          : undefined,
      };

      // Validate filters
      const validatedFilters = validateSchema(adminSearchSchema, filters);

      // Search admins
      const result = await adminService.searchAdmins(validatedFilters);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Admins retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get admin statistics
  async getAdminStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { period, startDate, endDate } = req.query;

      let startDateObj: Date | undefined;
      let endDateObj: Date | undefined;

      if (startDate) {
        startDateObj = new Date(startDate as string);
        if (isNaN(startDateObj.getTime())) {
          throw new APIError("Invalid start date", HttpStatus.BAD_REQUEST);
        }
      }

      if (endDate) {
        endDateObj = new Date(endDate as string);
        if (isNaN(endDateObj.getTime())) {
          throw new APIError("Invalid end date", HttpStatus.BAD_REQUEST);
        }
      }

      // Validate stats parameters
      const statsParams = {
        period: (period as string) || "month",
        startDate: startDateObj,
        endDate: endDateObj,
      };

      const validatedParams = validateSchema(adminStatsSchema, statsParams);

      // Get admin statistics
      const stats = await adminService.getAdminStats(
        validatedParams.period,
        validatedParams.startDate,
        validatedParams.endDate
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Admin statistics retrieved successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get dashboard statistics
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      // Get dashboard statistics
      const stats = await adminService.getDashboardStats();

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Dashboard statistics retrieved successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk operations on admins
  async bulkOperation(req: Request, res: Response, next: NextFunction) {
    try {
      const { adminIds, operation, additionalData } = req.body;

      if (!adminIds || !Array.isArray(adminIds) || adminIds.length === 0) {
        throw new APIError(
          "Admin IDs array is required",
          HttpStatus.BAD_REQUEST
        );
      }

      if (!operation) {
        throw new APIError("Operation is required", HttpStatus.BAD_REQUEST);
      }

      // Get the admin ID of the person performing the operation
      const performedBy = req.admin?.id;
      if (!performedBy) {
        throw new APIError("Unauthorized", HttpStatus.UNAUTHORIZED);
      }

      // Validate bulk operation parameters
      const validatedParams = validateSchema(adminBulkOperationSchema, {
        adminIds,
        operation,
        ...additionalData,
      });

      // Perform bulk operation
      const result = await adminService.bulkOperation(
        validatedParams.adminIds,
        validatedParams.operation,
        performedBy,
        additionalData
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Bulk operation completed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Deactivate admin
  async deactivateAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { adminId } = req.params;

      if (!adminId) {
        throw new APIError("Admin ID is required", HttpStatus.BAD_REQUEST);
      }

      // Get the admin ID of the person performing the deactivation
      const deactivatedBy = req.admin?.id;
      if (!deactivatedBy) {
        throw new APIError("Unauthorized", HttpStatus.UNAUTHORIZED);
      }

      // Deactivate admin
      const admin = await adminService.deactivateAdmin(adminId, deactivatedBy);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Admin deactivated successfully",
        data: admin,
      });
    } catch (error) {
      next(error);
    }
  }

  // Reactivate admin
  async reactivateAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { adminId } = req.params;

      if (!adminId) {
        throw new APIError("Admin ID is required", HttpStatus.BAD_REQUEST);
      }

      // Get the admin ID of the person performing the reactivation
      const reactivatedBy = req.admin?.id;
      if (!reactivatedBy) {
        throw new APIError("Unauthorized", HttpStatus.UNAUTHORIZED);
      }

      // Reactivate admin
      const admin = await adminService.reactivateAdmin(adminId, reactivatedBy);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Admin reactivated successfully",
        data: admin,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete admin
  async deleteAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { adminId } = req.params;

      if (!adminId) {
        throw new APIError("Admin ID is required", HttpStatus.BAD_REQUEST);
      }

      // Get the admin ID of the person performing the deletion
      const deletedBy = req.admin?.id;
      if (!deletedBy) {
        throw new APIError("Unauthorized", HttpStatus.UNAUTHORIZED);
      }

      // Delete admin
      const result = await adminService.deleteAdmin(adminId, deletedBy);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Admin deleted successfully",
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

  // Get admin activity log
  async getAdminActivityLog(req: Request, res: Response, next: NextFunction) {
    try {
      const queryParams = req.query;

      // Convert string values to appropriate types
      const filters = {
        ...queryParams,
        page: queryParams.page
          ? parseInt(queryParams.page as string)
          : undefined,
        limit: queryParams.limit
          ? parseInt(queryParams.limit as string)
          : undefined,
        startDate: queryParams.startDate
          ? new Date(queryParams.startDate as string)
          : undefined,
        endDate: queryParams.endDate
          ? new Date(queryParams.endDate as string)
          : undefined,
      };

      // Get admin activity log
      const result = await adminService.getAdminActivityLog(filters);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Admin activity log retrieved successfully",
        data: result,
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

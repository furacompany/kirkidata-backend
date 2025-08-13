import { Request, Response, NextFunction } from "express";
import userService from "../services/user.service";
import { validateSchema } from "../validations/user.validation";
import {
  userProfileUpdateSchema,
  userSearchSchema,
  userBulkOperationSchema,
  userStatsSchema,
} from "../validations/user.validation";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import logger from "../utils/logger";

class UserController {
  // Get user by ID (admin only)
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new APIError("User ID is required", HttpStatus.BAD_REQUEST);
      }

      // Get user by ID
      const user = await userService.getUserById(userId);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "User retrieved successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user by phone (admin only)
  async getUserByPhone(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone } = req.params;

      if (!phone) {
        throw new APIError("Phone number is required", HttpStatus.BAD_REQUEST);
      }

      // Get user by phone
      const user = await userService.getUserByPhone(phone);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "User retrieved successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user by email (admin only)
  async getUserByEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.params;

      if (!email) {
        throw new APIError("Email is required", HttpStatus.BAD_REQUEST);
      }

      // Get user by email
      const user = await userService.getUserByEmail(email);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "User retrieved successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user profile (user can update own profile, admin can update any)
  async updateUserProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const profileData = req.body;

      // Check for restricted fields
      if (profileData.email) {
        throw new APIError(
          "Email cannot be changed. Please contact support if you need to update your email.",
          HttpStatus.BAD_REQUEST
        );
      }

      if (profileData.phone) {
        throw new APIError(
          "Phone number cannot be changed. Please contact support if you need to update your phone number.",
          HttpStatus.BAD_REQUEST
        );
      }

      // Validate request body
      const validatedData = validateSchema(
        userProfileUpdateSchema,
        profileData
      );

      // Resolve the target user id to a guaranteed string
      let targetUserId: string;
      if (userId) {
        targetUserId = userId;
      } else if (req.user?.id) {
        targetUserId = req.user.id;
      } else {
        throw new APIError("User ID is required", HttpStatus.BAD_REQUEST);
      }

      // Update user profile
      const updatedUser = await userService.updateUserProfile(
        targetUserId,
        validatedData
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "User profile updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user wallet balance (admin only)
  async updateWalletBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { amount, operation, description } = req.body;

      if (!userId || !amount || !operation) {
        throw new APIError(
          "User ID, amount, and operation are required",
          HttpStatus.BAD_REQUEST
        );
      }

      if (!["add", "subtract"].includes(operation)) {
        throw new APIError(
          "Operation must be either add or subtract",
          HttpStatus.BAD_REQUEST
        );
      }

      if (typeof amount !== "number" || amount <= 0) {
        throw new APIError(
          "Amount must be a positive number",
          HttpStatus.BAD_REQUEST
        );
      }

      // Update wallet balance
      const result = await userService.updateWalletBalance(
        userId,
        amount,
        operation,
        description
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Wallet balance updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Search and filter users (admin only)
  async searchUsers(req: Request, res: Response, next: NextFunction) {
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
        isActive: queryParams.isActive
          ? queryParams.isActive === "true"
          : undefined,
        isEmailVerified: queryParams.isEmailVerified
          ? queryParams.isEmailVerified === "true"
          : undefined,

        minWalletBalance: queryParams.minWalletBalance
          ? parseFloat(queryParams.minWalletBalance as string)
          : undefined,
        maxWalletBalance: queryParams.maxWalletBalance
          ? parseFloat(queryParams.maxWalletBalance as string)
          : undefined,
        startDate: queryParams.startDate
          ? new Date(queryParams.startDate as string)
          : undefined,
        endDate: queryParams.endDate
          ? new Date(queryParams.endDate as string)
          : undefined,
      };

      // Validate filters
      const validatedFilters = validateSchema(userSearchSchema, filters);

      // Search users
      const result = await userService.searchUsers(validatedFilters);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Users retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user statistics (admin only)
  async getUserStats(req: Request, res: Response, next: NextFunction) {
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

      const validatedParams = validateSchema(userStatsSchema, statsParams);

      // Get user statistics
      const stats = await userService.getUserStats(
        validatedParams.period,
        validatedParams.startDate,
        validatedParams.endDate
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "User statistics retrieved successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk operations on users (admin only)
  async bulkOperation(req: Request, res: Response, next: NextFunction) {
    try {
      const { userIds, operation, additionalData } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new APIError(
          "User IDs array is required",
          HttpStatus.BAD_REQUEST
        );
      }

      if (!operation) {
        throw new APIError("Operation is required", HttpStatus.BAD_REQUEST);
      }

      // Validate bulk operation parameters
      const validatedParams = validateSchema(userBulkOperationSchema, {
        userIds,
        operation,
        ...additionalData,
      });

      // Perform bulk operation
      const result = await userService.bulkOperation(
        validatedParams.userIds,
        validatedParams.operation,
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

  // Deactivate user (admin only)
  async deactivateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new APIError("User ID is required", HttpStatus.BAD_REQUEST);
      }

      // Deactivate user
      const user = await userService.deactivateUser(userId);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "User deactivated successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Reactivate user (admin only)
  async reactivateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new APIError("User ID is required", HttpStatus.BAD_REQUEST);
      }

      // Reactivate user
      const user = await userService.reactivateUser(userId);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "User reactivated successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete user (admin only)
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new APIError("User ID is required", HttpStatus.BAD_REQUEST);
      }

      // Delete user
      const result = await userService.deleteUser(userId);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "User deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current user profile (user only)
  async getCurrentUserProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError("Unauthorized", HttpStatus.UNAUTHORIZED);
      }

      // Get user profile
      const user = await userService.getUserById(userId);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "User profile retrieved successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user wallet balance (user can see own, admin can see any)
  async getUserWalletBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      // Resolve the target user id to a guaranteed string
      let targetUserId: string;
      if (userId) {
        targetUserId = userId;
      } else if (req.user?.id) {
        targetUserId = req.user.id;
      } else {
        throw new APIError("User ID is required", HttpStatus.BAD_REQUEST);
      }

      // Get user wallet balance
      const user = await userService.getUserById(targetUserId);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Wallet balance retrieved successfully",
        data: {
          userId: user._id,
          walletBalance: user.wallet,
          currency: "NGN", // Assuming Nigerian Naira
        },
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
        message: "User service is healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();

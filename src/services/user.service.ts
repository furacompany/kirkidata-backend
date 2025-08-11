import UserModel from "../models/user.model";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import logger from "../utils/logger";
import { AuthService } from "./auth.service";

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  state?: string;
}

export interface UserSearchFilters {
  search?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  minWalletBalance?: number;
  maxWalletBalance?: number;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  averageWalletBalance: number;
  totalWalletBalance: number;
  newUsersThisPeriod: number;
  period: string;
}

class UserService {
  // Get user by ID
  async getUserById(userId: string) {
    try {
      const user = await UserModel.findById(userId).select("-password -pin");
      if (!user) {
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }
      return user;
    } catch (error) {
      logger.error(`Failed to get user by ID: ${userId}`, error);
      throw error;
    }
  }

  // Get user by phone
  async getUserByPhone(phone: string) {
    try {
      const user = await UserModel.findOne({ phone }).select("-password -pin");
      if (!user) {
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }
      return user;
    } catch (error) {
      logger.error(`Failed to get user by phone: ${phone}`, error);
      throw error;
    }
  }

  // Get user by email
  async getUserByEmail(email: string) {
    try {
      const user = await UserModel.findOne({ email }).select("-password -pin");
      if (!user) {
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }
      return user;
    } catch (error) {
      logger.error(`Failed to get user by email: ${email}`, error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(userId: string, profileData: UserProfile) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }

      // Update user profile with allowed fields (email and phone are already filtered out by validation)
      Object.assign(user, profileData);
      await user.save();

      logger.info(`User profile updated: ${userId}`);

      return user.toJSON();
    } catch (error) {
      logger.error(`Failed to update user profile: ${userId}`, error);
      throw error;
    }
  }

  // Update user wallet balance
  async updateWalletBalance(
    userId: string,
    amount: number,
    operation: "add" | "subtract",
    description?: string
  ) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }

      if (operation === "subtract" && user.wallet < amount) {
        throw new APIError(
          "Insufficient wallet balance",
          HttpStatus.BAD_REQUEST
        );
      }

      if (operation === "add") {
        user.wallet += amount;
      } else {
        user.wallet -= amount;
      }

      // Ensure wallet doesn't go negative
      if (user.wallet < 0) {
        user.wallet = 0;
      }

      await user.save();

      logger.info(
        `Wallet balance updated for user ${userId}: ${operation} ${amount}`
      );

      return {
        userId: user._id,
        newBalance: user.wallet,
        operation,
        amount,
        description,
      };
    } catch (error) {
      logger.error(
        `Failed to update wallet balance for user: ${userId}`,
        error
      );
      throw error;
    }
  }

  // Search and filter users
  async searchUsers(filters: UserSearchFilters) {
    try {
      const {
        search,
        isActive,
        isEmailVerified,
        minWalletBalance,
        maxWalletBalance,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = filters;

      // Build query
      const query: any = {};

      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      if (typeof isActive === "boolean") {
        query.isActive = isActive;
      }

      if (typeof isEmailVerified === "boolean") {
        query.isEmailVerified = isEmailVerified;
      }

      if (minWalletBalance !== undefined || maxWalletBalance !== undefined) {
        query.wallet = {};
        if (minWalletBalance !== undefined) {
          query.wallet.$gte = minWalletBalance;
        }
        if (maxWalletBalance !== undefined) {
          query.wallet.$lte = maxWalletBalance;
        }
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = startDate;
        }
        if (endDate) {
          query.createdAt.$lte = endDate;
        }
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Execute query with pagination
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        UserModel.find(query)
          .select("-password -pin")
          .sort(sort)
          .skip(skip)
          .limit(limit),
        UserModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error("Failed to search users", error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats(
    period: string = "month",
    startDate?: Date,
    endDate?: Date
  ): Promise<UserStats> {
    try {
      let dateFilter: any = {};

      if (period !== "all") {
        if (!startDate || !endDate) {
          throw new APIError(
            "Start and end dates are required for period-based stats",
            HttpStatus.BAD_REQUEST
          );
        }
        dateFilter = {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        };
      }

      const [
        totalUsers,
        activeUsers,
        verifiedUsers,
        walletStats,
        newUsersThisPeriod,
      ] = await Promise.all([
        UserModel.countDocuments(),
        UserModel.countDocuments({ isActive: true }),
        UserModel.countDocuments({ isEmailVerified: true }),
        UserModel.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: null,
              totalBalance: { $sum: "$wallet" },
              avgBalance: { $avg: "$wallet" },
            },
          },
        ]),
        UserModel.countDocuments(dateFilter),
      ]);

      const walletData = walletStats[0] || { totalBalance: 0, avgBalance: 0 };

      return {
        totalUsers,
        activeUsers,
        verifiedUsers,
        averageWalletBalance: Math.round(walletData.avgBalance * 100) / 100,
        totalWalletBalance: walletData.totalBalance,
        newUsersThisPeriod,
        period,
      };
    } catch (error) {
      logger.error("Failed to get user statistics", error);
      throw error;
    }
  }

  // Bulk operations on users
  async bulkOperation(
    userIds: string[],
    operation: string,
    additionalData?: any
  ) {
    try {
      const validOperations = [
        "activate",
        "deactivate",
        "delete",
        "verifyEmail",
        "resetPin",
      ];

      if (!validOperations.includes(operation)) {
        throw new APIError("Invalid operation", HttpStatus.BAD_REQUEST);
      }

      let updateData: any = {};
      let result: any = {};

      switch (operation) {
        case "activate":
          updateData = { isActive: true };
          result = await UserModel.updateMany(
            { _id: { $in: userIds } },
            updateData
          );
          break;

        case "deactivate":
          updateData = { isActive: false };
          result = await UserModel.updateMany(
            { _id: { $in: userIds } },
            updateData
          );
          break;

        case "delete":
          result = await UserModel.deleteMany({ _id: { $in: userIds } });
          break;

        case "verifyEmail":
          updateData = { isEmailVerified: true };
          result = await UserModel.updateMany(
            { _id: { $in: userIds } },
            updateData
          );
          break;

        case "resetPin":
          // Generate a new random 4-digit PIN for each user
          for (const userId of userIds) {
            const user = await UserModel.findById(userId);
            if (user) {
              const newPin = Math.floor(1000 + Math.random() * 9000).toString();
              await user.setPin(newPin);
              await user.save();
            }
          }
          result = { modifiedCount: userIds.length };
          break;
      }

      logger.info(
        `Bulk operation ${operation} completed on ${userIds.length} users`
      );

      return {
        operation,
        affectedUsers: result.modifiedCount || result.deletedCount || 0,
        totalRequested: userIds.length,
      };
    } catch (error) {
      logger.error(`Bulk operation ${operation} failed`, error);
      throw error;
    }
  }

  // Deactivate user (admin only)
  async deactivateUser(userId: string) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }

      if (!user.isActive) {
        throw new APIError(
          "User is already deactivated",
          HttpStatus.BAD_REQUEST
        );
      }

      user.isActive = false;
      await user.save();

      // Force logout all sessions for the deactivated user
      const authService = new AuthService();
      await authService.forceLogoutAllSessions(userId, "user");

      logger.info(`User deactivated: ${userId}`);

      return user;
    } catch (error) {
      logger.error(`Failed to deactivate user: ${userId}`, error);
      throw error;
    }
  }

  // Reactivate user
  async reactivateUser(userId: string) {
    try {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { isActive: true },
        { new: true }
      ).select("-password -pin");

      if (!user) {
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }

      logger.info(`User reactivated: ${userId}`);

      return user;
    } catch (error) {
      logger.error(`Failed to reactivate user: ${userId}`, error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(userId: string) {
    try {
      const user = await UserModel.findByIdAndDelete(userId);
      if (!user) {
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }

      logger.info(`User deleted: ${userId}`);

      return { message: "User deleted successfully" };
    } catch (error) {
      logger.error(`Failed to delete user: ${userId}`, error);
      throw error;
    }
  }
}

export default new UserService();

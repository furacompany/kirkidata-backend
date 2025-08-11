import AdminModel from "../models/admin.model";
import UserModel from "../models/user.model";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import logger from "../utils/logger";
import { AuthService } from "./auth.service";

// Alias for consistency
const Admin = AdminModel;
const User = UserModel;

export interface AdminProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: "admin" | "super_admin";
}

export interface AdminSearchFilters {
  search?: string;
  role?: "admin" | "super_admin";
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface AdminStats {
  totalAdmins: number;
  activeAdmins: number;
  superAdmins: number;
  regularAdmins: number;
  newAdminsThisPeriod: number;
  period: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalAdmins: number;
  activeAdmins: number;
  totalWalletBalance: number;
  averageWalletBalance: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

class AdminService {
  // Get admin by ID
  async getAdminById(adminId: string) {
    try {
      const admin = await AdminModel.findById(adminId).select("-password");
      if (!admin) {
        throw new APIError("Admin not found", HttpStatus.NOT_FOUND);
      }
      return admin;
    } catch (error) {
      logger.error(`Failed to get admin by ID: ${adminId}`, error);
      throw error;
    }
  }

  // Get admin by email
  async getAdminByEmail(email: string) {
    try {
      const admin = await AdminModel.findOne({ email }).select("-password");
      if (!admin) {
        throw new APIError("Admin not found", HttpStatus.NOT_FOUND);
      }
      return admin;
    } catch (error) {
      logger.error(`Failed to get admin by email: ${email}`, error);
      throw error;
    }
  }

  // Update admin profile
  async updateAdminProfile(
    adminId: string,
    profileData: AdminProfile,
    updatedBy: string
  ) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin) {
        throw new APIError("Admin not found", HttpStatus.NOT_FOUND);
      }

      // Check for unique constraints on phone
      if (profileData.phone && profileData.phone !== admin.phone) {
        const existingAdmin = await Admin.findOne({ phone: profileData.phone });
        if (existingAdmin) {
          throw new APIError(
            "Phone number already in use",
            HttpStatus.CONFLICT
          );
        }
      }

      // Only super admin can change roles
      if (profileData.role && profileData.role !== admin.role) {
        const updater = await Admin.findById(updatedBy);
        if (!updater || updater.role !== "super_admin") {
          throw new APIError(
            "Only super admin can change roles",
            HttpStatus.FORBIDDEN
          );
        }
      }

      // Update admin profile
      Object.assign(admin, profileData);
      await admin.save();

      logger.info(`Admin profile updated by ${updatedBy}: ${adminId}`);

      return admin;
    } catch (error) {
      logger.error(`Failed to update admin profile: ${adminId}`, error);
      throw error;
    }
  }

  // Change admin password
  async changeAdminPassword(
    adminId: string,
    currentPassword: string,
    newPassword: string
  ) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin) {
        throw new APIError("Admin not found", HttpStatus.NOT_FOUND);
      }

      // Verify current password
      const isCurrentPasswordValid = await admin.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        throw new APIError(
          "Current password is incorrect",
          HttpStatus.BAD_REQUEST
        );
      }

      // Set new password
      await admin.setPassword(newPassword);
      await admin.save();

      logger.info(`Admin password changed: ${adminId}`);

      return { message: "Password changed successfully" };
    } catch (error) {
      logger.error(`Failed to change admin password: ${adminId}`, error);
      throw error;
    }
  }

  // Search and filter admins
  async searchAdmins(filters: AdminSearchFilters) {
    try {
      const {
        search,
        role,
        isActive,
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
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ];
      }

      if (role) {
        query.role = role;
      }

      if (typeof isActive === "boolean") {
        query.isActive = isActive;
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

      const [admins, total] = await Promise.all([
        Admin.find(query)
          .select("-password")
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Admin.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        admins,
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
      logger.error("Failed to search admins", error);
      throw error;
    }
  }

  // Get admin statistics
  async getAdminStats(
    period: string = "month",
    startDate?: Date,
    endDate?: Date
  ): Promise<AdminStats> {
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
        totalAdmins,
        activeAdmins,
        superAdmins,
        regularAdmins,
        newAdminsThisPeriod,
      ] = await Promise.all([
        Admin.countDocuments(),
        Admin.countDocuments({ isActive: true }),
        Admin.countDocuments({ role: "super_admin" }),
        Admin.countDocuments({ role: "admin" }),
        Admin.countDocuments(dateFilter),
      ]);

      return {
        totalAdmins,
        activeAdmins,
        superAdmins,
        regularAdmins,
        newAdminsThisPeriod,
        period,
      };
    } catch (error) {
      logger.error("Failed to get admin statistics", error);
      throw error;
    }
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const [
        totalUsers,
        activeUsers,
        totalAdmins,
        activeAdmins,
        walletStats,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        Admin.countDocuments(),
        Admin.countDocuments({ isActive: true }),
        User.aggregate([
          {
            $group: {
              _id: null,
              totalBalance: { $sum: "$wallet" },
              avgBalance: { $avg: "$wallet" },
            },
          },
        ]),
        User.countDocuments({
          createdAt: {
            $gte: new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate()
            ),
          },
        }),
        User.countDocuments({
          createdAt: { $gte: startOfWeek },
        }),
        User.countDocuments({
          createdAt: { $gte: startOfMonth },
        }),
      ]);

      const walletData = walletStats[0] || { totalBalance: 0, avgBalance: 0 };

      return {
        totalUsers,
        activeUsers,
        totalAdmins,
        activeAdmins,
        totalWalletBalance: walletData.totalBalance,
        averageWalletBalance: Math.round(walletData.avgBalance * 100) / 100,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
      };
    } catch (error) {
      logger.error("Failed to get dashboard statistics", error);
      throw error;
    }
  }

  // Bulk operations on admins
  async bulkOperation(
    adminIds: string[],
    operation: string,
    performedBy: string,
    additionalData?: any
  ) {
    try {
      const validOperations = [
        "activate",
        "deactivate",
        "changeRole",
        "resetPassword",
      ];

      if (!validOperations.includes(operation)) {
        throw new APIError("Invalid operation", HttpStatus.BAD_REQUEST);
      }

      // Check if performer is super admin for role changes
      if (operation === "changeRole") {
        const performer = await Admin.findById(performedBy);
        if (!performer || performer.role !== "super_admin") {
          throw new APIError(
            "Only super admin can change roles",
            HttpStatus.FORBIDDEN
          );
        }
      }

      let updateData: any = {};
      let result: any = {};

      switch (operation) {
        case "activate":
          updateData = { isActive: true };
          result = await Admin.updateMany(
            { _id: { $in: adminIds } },
            updateData
          );
          break;

        case "deactivate":
          updateData = { isActive: false };
          result = await Admin.updateMany(
            { _id: { $in: adminIds } },
            updateData
          );
          break;

        case "changeRole":
          if (!additionalData?.newRole) {
            throw new APIError(
              "New role is required for role change operation",
              HttpStatus.BAD_REQUEST
            );
          }
          updateData = { role: additionalData.newRole };
          result = await Admin.updateMany(
            { _id: { $in: adminIds } },
            updateData
          );
          break;

        case "resetPassword":
          // For password reset, we'll need to generate a temporary password
          // This is a simplified version - in production you might want to send email
          const tempPassword = Math.random().toString(36).slice(-8);
          for (const adminId of adminIds) {
            const admin = await Admin.findById(adminId);
            if (admin) {
              await admin.setPassword(tempPassword);
              await admin.save();
            }
          }
          result = { modifiedCount: adminIds.length };
          break;
      }

      logger.info(
        `Bulk operation ${operation} completed by ${performedBy} on ${adminIds.length} admins`
      );

      return {
        operation,
        affectedAdmins: result.modifiedCount || 0,
        totalRequested: adminIds.length,
      };
    } catch (error) {
      logger.error(`Bulk operation ${operation} failed`, error);
      throw error;
    }
  }

  // Deactivate admin
  async deactivateAdmin(adminId: string, deactivatedBy: string) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin) {
        throw new APIError("Admin not found", HttpStatus.NOT_FOUND);
      }

      // Prevent deactivating self
      if (adminId === deactivatedBy) {
        throw new APIError(
          "Cannot deactivate yourself",
          HttpStatus.BAD_REQUEST
        );
      }

      // Only super admin can deactivate other super admins
      if (admin.role === "super_admin") {
        const deactivator = await Admin.findById(deactivatedBy);
        if (!deactivator || deactivator.role !== "super_admin") {
          throw new APIError(
            "Only super admin can deactivate super admins",
            HttpStatus.FORBIDDEN
          );
        }
      }

      admin.isActive = false;
      await admin.save();

      // Force logout all sessions for the deactivated admin
      const authService = new AuthService();
      await authService.forceLogoutAllSessions(adminId, "admin");

      logger.info(`Admin deactivated by ${deactivatedBy}: ${adminId}`);

      return admin;
    } catch (error) {
      logger.error(`Failed to deactivate admin: ${adminId}`, error);
      throw error;
    }
  }

  // Reactivate admin
  async reactivateAdmin(adminId: string, reactivatedBy: string) {
    try {
      const admin = await Admin.findByIdAndUpdate(
        adminId,
        { isActive: true },
        { new: true }
      ).select("-password");

      if (!admin) {
        throw new APIError("Admin not found", HttpStatus.NOT_FOUND);
      }

      logger.info(`Admin reactivated by ${reactivatedBy}: ${adminId}`);

      return admin;
    } catch (error) {
      logger.error(`Failed to reactivate admin: ${adminId}`, error);
      throw error;
    }
  }

  // Delete admin
  async deleteAdmin(adminId: string, deletedBy: string) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin) {
        throw new APIError("Admin not found", HttpStatus.NOT_FOUND);
      }

      // Prevent deleting self
      if (adminId === deletedBy) {
        throw new APIError("Cannot delete yourself", HttpStatus.BAD_REQUEST);
      }

      // Only super admin can delete other super admins
      if (admin.role === "super_admin") {
        const deleter = await Admin.findById(deletedBy);
        if (!deleter || deleter.role !== "super_admin") {
          throw new APIError(
            "Only super admin can delete super admins",
            HttpStatus.FORBIDDEN
          );
        }
      }

      await Admin.findByIdAndDelete(adminId);

      logger.info(`Admin deleted by ${deletedBy}: ${adminId}`);

      return { message: "Admin deleted successfully" };
    } catch (error) {
      logger.error(`Failed to delete admin: ${adminId}`, error);
      throw error;
    }
  }

  // Get admin activity log (placeholder for future implementation)
  async getAdminActivityLog(filters: any) {
    try {
      // This would typically query an activity log collection
      // For now, return empty result
      return {
        activities: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    } catch (error) {
      logger.error("Failed to get admin activity log", error);
      throw error;
    }
  }
}

export default new AdminService();

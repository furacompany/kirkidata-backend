import AdminModel from "../models/admin.model";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import logger from "../utils/logger";

// Alias for consistency
const Admin = AdminModel;

export interface AdminProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: "admin" | "super_admin";
}

class AdminService {
  // Get admin by ID (for self-profile retrieval)
  async getAdminById(adminId: string) {
    try {
      const admin = await Admin.findById(adminId).select("-password");
      if (!admin) {
        throw new APIError("Admin not found", HttpStatus.NOT_FOUND);
      }
      return admin;
    } catch (error) {
      logger.error(`Failed to get admin by ID: ${adminId}`, error);
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

      // Validate new password format
      if (!newPassword || typeof newPassword !== "string") {
        throw new APIError("New password is required", HttpStatus.BAD_REQUEST);
      }

      if (newPassword.length < 6 || newPassword.length > 12) {
        throw new APIError(
          "New password must be between 6 and 12 characters",
          HttpStatus.BAD_REQUEST
        );
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

      // Check if new password is same as current password
      const isNewPasswordSame = await admin.comparePassword(newPassword);
      if (isNewPasswordSame) {
        throw new APIError(
          "New password must be different from current password",
          HttpStatus.BAD_REQUEST
        );
      }

      // Set new password using the model method
      try {
        await admin.setPassword(newPassword);
        await admin.save();
      } catch (passwordError) {
        // Convert any password-related errors to proper API errors
        if (passwordError instanceof Error) {
          throw new APIError(
            passwordError.message,
            HttpStatus.BAD_REQUEST
          );
        }
        throw passwordError;
      }

      logger.info(`Admin password changed: ${adminId}`);

      return { message: "Password changed successfully" };
    } catch (error) {
      logger.error(`Failed to change admin password: ${adminId}`, error);
      throw error;
    }
  }
}

export default new AdminService();

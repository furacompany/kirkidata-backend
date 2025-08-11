import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { IUser } from "../models/user.model";
import UserModel from "../models/user.model";
import { IAdmin } from "../models/admin.model";
import AdminModel from "../models/admin.model";
import {
  generateAccessToken,
  generateRefreshToken,
  generateAdminAccessToken,
  generateAdminRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  isTokenInvalidatedByLogout,
} from "../configs/jwt";
import nodemailerConfig from "../configs/nodemailer";
import { generateWelcomeEmail } from "../utils/emailTemplates";
import otpService from "./otp.service";
import logger from "../utils/logger";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";

export interface AuthResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    isEmailVerified: boolean;
    isActive: boolean;
    wallet: number;
    profile: {
      avatar?: string;
      dateOfBirth?: Date;
      address?: string;
      state?: string;
    };
  };
  accessToken: string;
  refreshToken: string;
}

export interface AdminAuthResponse {
  admin: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    isActive: boolean;
    role: "admin" | "super_admin";
  };
  accessToken: string;
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  // User Registration
  async registerUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    pin: string; // Required during registration
  }): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await UserModel.findOne({
        $or: [{ email: userData.email }, { phone: userData.phone }],
      });

      if (existingUser) {
        throw new APIError(
          "User already exists with this email or phone number",
          HttpStatus.CONFLICT
        );
      }

      // Create new user
      const user = new UserModel({
        ...userData,
      });

      await user.save();

      // Send welcome email
      try {
        const welcomeHtml = generateWelcomeEmail(user.firstName);
        await nodemailerConfig.sendEmail({
          to: user.email,
          subject: "Welcome to KirkiData!",
          html: welcomeHtml,
        });
        logger.info(`Welcome email sent to: ${user.email}`);
      } catch (emailError) {
        logger.warn("Failed to send welcome email:", emailError);
      }

      // Send email verification OTP
      try {
        await otpService.createEmailVerificationOTP(user.email, user.firstName);
        logger.info(`Email verification OTP sent to: ${user.email}`);
      } catch (otpError) {
        logger.warn("Failed to send email verification OTP:", otpError);
      }

      // Generate tokens
      const accessToken = generateAccessToken({
        id: user._id.toString(),
        email: user.email,
        phone: user.phone,
        role: "user",
      });

      const refreshToken = generateRefreshToken({
        id: user._id.toString(),
        email: user.email,
        phone: user.phone,
        role: "user",
      });

      return {
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          wallet: user.wallet,
          profile: user.profile,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error("User registration failed:", error);
      throw error;
    }
  }

  // Admin Registration (Public endpoint for super admin creation)
  async registerAdmin(adminData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    role: "admin" | "super_admin";
  }): Promise<AdminAuthResponse> {
    try {
      // Check if admin already exists
      const existingAdmin = await AdminModel.findOne({
        $or: [{ email: adminData.email }, { phone: adminData.phone }],
      });

      if (existingAdmin) {
        throw new APIError(
          "Admin already exists with this email or phone number",
          HttpStatus.CONFLICT
        );
      }

      // Create new admin
      const admin = new AdminModel({
        ...adminData,
      });

      await admin.save();

      // Generate tokens
      const accessToken = generateAdminAccessToken({
        id: admin._id.toString(),
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
      });

      const refreshToken = generateAdminRefreshToken({
        id: admin._id.toString(),
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
      });

      logger.info(`Admin registered successfully: ${admin.email}`);

      return {
        admin: {
          id: admin._id.toString(),
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          phone: admin.phone,
          isActive: admin.isActive,
          role: admin.role,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error("Admin registration failed:", error);
      throw error;
    }
  }

  // User Login
  async loginUser(phone: string, password: string): Promise<AuthResponse> {
    try {
      // Find user by phone
      const user = await UserModel.findOne({ phone }).select("+password");
      if (!user) {
        throw new APIError(
          "Invalid phone number or password",
          HttpStatus.UNAUTHORIZED
        );
      }

      // Check if user is active
      if (!user.isActive) {
        throw new APIError("Account is deactivated", HttpStatus.FORBIDDEN);
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new APIError(
          "Invalid phone number or password",
          HttpStatus.UNAUTHORIZED
        );
      }

      // Update last login time
      user.lastLoginAt = new Date();
      await user.save();

      // Generate tokens
      const accessToken = generateAccessToken({
        id: user._id.toString(),
        email: user.email,
        phone: user.phone,
        role: "user",
      });

      const refreshToken = generateRefreshToken({
        id: user._id.toString(),
        email: user.email,
        phone: user.phone,
        role: "user",
      });

      return {
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          wallet: user.wallet,
          profile: user.profile,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error("User login failed:", error);
      throw error;
    }
  }

  // Admin Login
  async loginAdmin(
    email: string,
    password: string
  ): Promise<AdminAuthResponse> {
    try {
      // Find admin by email
      const admin = await AdminModel.findOne({ email }).select("+password");
      if (!admin) {
        throw new APIError(
          "Invalid email or password",
          HttpStatus.UNAUTHORIZED
        );
      }

      // Check if admin is active
      if (!admin.isActive) {
        throw new APIError("Account is deactivated", HttpStatus.FORBIDDEN);
      }

      // Verify password
      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        throw new APIError(
          "Invalid email or password",
          HttpStatus.UNAUTHORIZED
        );
      }

      // Update last login time
      admin.lastLoginAt = new Date();
      await admin.save();

      // Generate tokens
      const accessToken = generateAdminAccessToken({
        id: admin._id.toString(),
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
      });

      const refreshToken = generateAdminRefreshToken({
        id: admin._id.toString(),
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
      });

      return {
        admin: {
          id: admin._id.toString(),
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          phone: admin.phone,
          isActive: admin.isActive,
          role: admin.role,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error("Admin login failed:", error);
      throw error;
    }
  }

  // Refresh Token
  async refreshToken(
    refreshToken: string,
    role: "user" | "admin" | "super_admin"
  ): Promise<TokenResponse> {
    try {
      let payload: any;

      if (role === "user") {
        payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
      } else {
        payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
      }

      if (payload.type !== "refresh") {
        throw new APIError("Invalid token type", HttpStatus.UNAUTHORIZED);
      }

      // Check if token is invalidated by logout
      if (role === "user") {
        const user = await UserModel.findById(payload.id);
        if (!user) {
          throw new APIError("User not found", HttpStatus.UNAUTHORIZED);
        }

        if (isTokenInvalidatedByLogout(payload, user.lastLogoutAt)) {
          throw new APIError(
            "Refresh token invalidated due to logout",
            HttpStatus.UNAUTHORIZED
          );
        }
      } else {
        const admin = await AdminModel.findById(payload.id);
        if (!admin) {
          throw new APIError("Admin not found", HttpStatus.UNAUTHORIZED);
        }

        if (isTokenInvalidatedByLogout(payload, admin.lastLogoutAt)) {
          throw new APIError(
            "Refresh token invalidated due to logout",
            HttpStatus.UNAUTHORIZED
          );
        }
      }

      // Generate new tokens
      if (role === "user") {
        const accessToken = generateAccessToken({
          id: payload.id,
          email: payload.email,
          phone: payload.phone,
          role: payload.role,
        });

        const newRefreshToken = generateRefreshToken({
          id: payload.id,
          email: payload.email,
          phone: payload.phone,
          role: payload.role,
        });

        return {
          accessToken,
          refreshToken: newRefreshToken,
        };
      } else {
        const accessToken = generateAdminAccessToken({
          id: payload.id,
          email: payload.email,
          phone: payload.phone,
          role: payload.role,
        });

        const newRefreshToken = generateAdminRefreshToken({
          id: payload.id,
          email: payload.email,
          phone: payload.phone,
          role: payload.role,
        });

        return {
          accessToken,
          refreshToken: newRefreshToken,
        };
      }
    } catch (error) {
      logger.error("Token refresh failed:", error);
      throw new APIError(
        "Invalid or expired refresh token",
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  // Forgot Password
  async forgotPassword(email: string): Promise<void> {
    try {
      // Find user by email
      const user = await UserModel.findOne({ email });
      if (!user) {
        // Don't reveal if user exists or not for security
        logger.info(
          `Password reset requested for email: ${email} (user not found)`
        );
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        throw new APIError("Account is deactivated", HttpStatus.FORBIDDEN);
      }

      // Send password reset OTP
      await otpService.createPasswordResetOTP(email, user.firstName);

      logger.info(`Password reset OTP sent to: ${email}`);
    } catch (error) {
      logger.error("Forgot password failed:", error);
      throw error;
    }
  }

  // Reset Password
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Verify OTP
      const isOTPValid = await otpService.verifyPasswordResetOTP(email, otp);
      if (!isOTPValid) {
        throw new APIError("Invalid or expired OTP", HttpStatus.BAD_REQUEST);
      }

      // Find user
      const user = await UserModel.findOne({ email });
      if (!user) {
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }

      // Check if user is active
      if (!user.isActive) {
        throw new APIError("Account is deactivated", HttpStatus.FORBIDDEN);
      }

      // Update password
      await user.setPassword(newPassword);
      await user.save();

      logger.info(`Password reset successful for user: ${user.email}`);
    } catch (error) {
      logger.error("Password reset failed:", error);
      throw error;
    }
  }

  // Verify Email
  async verifyEmail(email: string, otp: string): Promise<void> {
    try {
      // Verify OTP
      const isOTPValid = await otpService.verifyEmailVerificationOTP(
        email,
        otp
      );
      if (!isOTPValid) {
        throw new APIError("Invalid or expired OTP", HttpStatus.BAD_REQUEST);
      }

      // Find user
      const user = await UserModel.findOne({ email });
      if (!user) {
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }

      // Check if user is active
      if (!user.isActive) {
        throw new APIError("Account is deactivated", HttpStatus.FORBIDDEN);
      }

      // Update email verification status
      user.isEmailVerified = true;
      await user.save();

      logger.info(`Email verification successful for user: ${user.email}`);
    } catch (error) {
      logger.error("Email verification failed:", error);
      throw error;
    }
  }

  // Resend Email Verification OTP
  async resendEmailVerification(email: string): Promise<void> {
    try {
      // Find user
      const user = await UserModel.findOne({ email });
      if (!user) {
        // Don't reveal if user exists or not for security
        logger.info(
          `Email verification OTP resend requested for email: ${email} (user not found)`
        );
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        throw new APIError("Account is deactivated", HttpStatus.FORBIDDEN);
      }

      // Check if email is already verified
      if (user.isEmailVerified) {
        throw new APIError("Email is already verified", HttpStatus.BAD_REQUEST);
      }

      // Send new email verification OTP
      await otpService.createEmailVerificationOTP(email, user.firstName);

      logger.info(`Email verification OTP resent to: ${email}`);
    } catch (error) {
      logger.error("Resend email verification failed:", error);
      throw error;
    }
  }

  // Validate PIN
  async validatePin(
    userId: string,
    pin: string
  ): Promise<{ isValid: boolean }> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }

      const isValid = await user.comparePin(pin);

      logger.info(
        `PIN validation ${
          isValid ? "successful" : "failed"
        } for user: ${userId}`
      );

      return { isValid };
    } catch (error) {
      logger.error("PIN validation failed:", error);
      throw error;
    }
  }

  // Change PIN
  async changePin(
    userId: string,
    currentPin: string,
    newPin: string
  ): Promise<{ message: string }> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }

      // Verify current PIN
      const isCurrentPinValid = await user.comparePin(currentPin);
      if (!isCurrentPinValid) {
        throw new APIError("Current PIN is incorrect", HttpStatus.BAD_REQUEST);
      }

      // Set new PIN
      await user.setPin(newPin);
      await user.save();

      logger.info(`PIN changed successfully for user: ${userId}`);

      return { message: "PIN changed successfully" };
    } catch (error) {
      logger.error("PIN change failed:", error);
      throw error;
    }
  }

  // Logout
  async logout(
    userId?: string,
    userType: "user" | "admin" = "user"
  ): Promise<void> {
    try {
      if (!userId) {
        logger.warn("Logout called without userId");
        return;
      }

      if (userType === "user") {
        // Update user's lastLogoutAt
        await UserModel.findByIdAndUpdate(userId, {
          lastLogoutAt: new Date(),
        });
        logger.info(`User logged out: ${userId}`);
      } else {
        // Update admin's lastLogoutAt
        await AdminModel.findByIdAndUpdate(userId, {
          lastLogoutAt: new Date(),
        });
        logger.info(`Admin logged out: ${userId}`);
      }
    } catch (error) {
      logger.error(
        `Failed to update logout time for ${userType}: ${userId}`,
        error
      );
      throw error;
    }
  }

  // Force logout all sessions for a user (admin action)
  async forceLogoutAllSessions(
    userId: string,
    userType: "user" | "admin" = "user"
  ): Promise<void> {
    try {
      if (userType === "user") {
        await UserModel.findByIdAndUpdate(userId, {
          lastLogoutAt: new Date(),
        });
        logger.info(`All user sessions force logged out: ${userId}`);
      } else {
        await AdminModel.findByIdAndUpdate(userId, {
          lastLogoutAt: new Date(),
        });
        logger.info(`All admin sessions force logged out: ${userId}`);
      }
    } catch (error) {
      logger.error(
        `Failed to force logout all sessions for ${userType}: ${userId}`,
        error
      );
      throw error;
    }
  }

  // Get user session information
  async getSessionInfo(
    userId: string,
    userType: "user" | "admin" = "user"
  ): Promise<{
    lastLoginAt?: Date;
    lastLogoutAt?: Date;
    isActive: boolean;
  }> {
    try {
      if (userType === "user") {
        const user = await UserModel.findById(userId).select(
          "lastLoginAt lastLogoutAt isActive"
        );
        if (!user) {
          throw new APIError("User not found", HttpStatus.NOT_FOUND);
        }
        const result: {
          lastLoginAt?: Date;
          lastLogoutAt?: Date;
          isActive: boolean;
        } = {
          isActive: user.isActive,
        };

        if (user.lastLoginAt) result.lastLoginAt = user.lastLoginAt;
        if (user.lastLogoutAt) result.lastLogoutAt = user.lastLogoutAt;

        return result;
      } else {
        const admin = await AdminModel.findById(userId).select(
          "lastLoginAt lastLogoutAt isActive"
        );
        if (!admin) {
          throw new APIError("Admin not found", HttpStatus.NOT_FOUND);
        }
        const result: {
          lastLoginAt?: Date;
          lastLogoutAt?: Date;
          isActive: boolean;
        } = {
          isActive: admin.isActive,
        };

        if (admin.lastLoginAt) result.lastLoginAt = admin.lastLoginAt;
        if (admin.lastLogoutAt) result.lastLogoutAt = admin.lastLogoutAt;

        return result;
      }
    } catch (error) {
      logger.error(
        `Failed to get session info for ${userType}: ${userId}`,
        error
      );
      throw error;
    }
  }

  // Check if user has active sessions
  async hasActiveSessions(
    userId: string,
    userType: "user" | "admin" = "user"
  ): Promise<boolean> {
    try {
      const sessionInfo = await this.getSessionInfo(userId, userType);

      // If no logout time recorded, user has active sessions
      if (!sessionInfo.lastLogoutAt) {
        return true;
      }

      // If last login is after last logout, user has active sessions
      if (
        sessionInfo.lastLoginAt &&
        sessionInfo.lastLoginAt > sessionInfo.lastLogoutAt
      ) {
        return true;
      }

      return false;
    } catch (error) {
      logger.error(
        `Failed to check active sessions for ${userType}: ${userId}`,
        error
      );
      return false;
    }
  }
}

import OTPModel, { IOTP } from "../models/otp.model";
import nodemailerConfig from "../configs/nodemailer";
import {
  generateEmailVerificationOTP,
  generatePasswordResetOTP,
} from "../utils/emailTemplates";
import logger from "../utils/logger";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";

class OTPService {
  // Generate a random 6-digit OTP
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create and send email verification OTP
  async createEmailVerificationOTP(
    email: string,
    firstName: string
  ): Promise<void> {
    try {
      // Delete any existing email verification OTPs for this email
      await OTPModel.deleteMany({ email, type: "email_verification" });

      // Generate new OTP
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Save OTP to database
      const otpDoc = new OTPModel({
        email,
        otp,
        type: "email_verification",
        expiresAt,
      });
      await otpDoc.save();

      // Generate email HTML
      const html = generateEmailVerificationOTP(firstName, otp);

      // Send email
      const success = await nodemailerConfig.sendEmail({
        to: email,
        subject: "Verify Your Email - KirkiData",
        html,
      });

      if (!success) {
        throw new APIError(
          "Failed to send verification email",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      logger.info(`Email verification OTP sent to: ${email}`);
    } catch (error) {
      logger.error(
        `Failed to create email verification OTP for: ${email}`,
        error
      );
      throw error;
    }
  }

  // Create and send password reset OTP
  async createPasswordResetOTP(
    email: string,
    firstName: string
  ): Promise<void> {
    try {
      // Delete any existing password reset OTPs for this email
      await OTPModel.deleteMany({ email, type: "password_reset" });

      // Generate new OTP
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Save OTP to database
      const otpDoc = new OTPModel({
        email,
        otp,
        type: "password_reset",
        expiresAt,
      });
      await otpDoc.save();

      // Generate email HTML
      const html = generatePasswordResetOTP(firstName, otp);

      // Send email
      const success = await nodemailerConfig.sendEmail({
        to: email,
        subject: "Password Reset - KirkiData",
        html,
      });

      if (!success) {
        throw new APIError(
          "Failed to send password reset email",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      logger.info(`Password reset OTP sent to: ${email}`);
    } catch (error) {
      logger.error(`Failed to create password reset OTP for: ${email}`, error);
      throw error;
    }
  }

  // Verify email verification OTP
  async verifyEmailVerificationOTP(
    email: string,
    otp: string
  ): Promise<boolean> {
    try {
      const otpDoc = await OTPModel.findOne({
        email,
        otp,
        type: "email_verification",
        isUsed: false,
      });

      if (!otpDoc) {
        return false;
      }

      // Check if OTP is expired
      if (otpDoc.isExpired && otpDoc.isExpired()) {
        await OTPModel.deleteOne({ _id: otpDoc._id });
        return false;
      }

      // Mark OTP as used
      if (otpDoc.markAsUsed) {
        otpDoc.markAsUsed();
        await otpDoc.save();
      } else {
        // Fallback if method doesn't exist
        otpDoc.isUsed = true;
        await otpDoc.save();
      }

      logger.info(`Email verification OTP verified for: ${email}`);
      return true;
    } catch (error) {
      logger.error(
        `Failed to verify email verification OTP for: ${email}`,
        error
      );
      throw error;
    }
  }

  // Verify password reset OTP
  async verifyPasswordResetOTP(email: string, otp: string): Promise<boolean> {
    try {
      const otpDoc = await OTPModel.findOne({
        email,
        otp,
        type: "password_reset",
        isUsed: false,
      });

      if (!otpDoc) {
        return false;
      }

      // Check if OTP is expired
      if (otpDoc.isExpired && otpDoc.isExpired()) {
        await OTPModel.deleteOne({ _id: otpDoc._id });
        return false;
      }

      // Mark OTP as used
      if (otpDoc.markAsUsed) {
        otpDoc.markAsUsed();
        await otpDoc.save();
      } else {
        // Fallback if method doesn't exist
        otpDoc.isUsed = true;
        await otpDoc.save();
      }

      logger.info(`Password reset OTP verified for: ${email}`);
      return true;
    } catch (error) {
      logger.error(`Failed to verify password reset OTP for: ${email}`, error);
      throw error;
    }
  }

  // Clean up expired OTPs
  async cleanupExpiredOTPs(): Promise<void> {
    try {
      const result = await OTPModel.deleteMany({
        expiresAt: { $lt: new Date() },
      });

      if (result.deletedCount > 0) {
        logger.info(`Cleaned up ${result.deletedCount} expired OTPs`);
      }
    } catch (error) {
      logger.error("Failed to cleanup expired OTPs", error);
    }
  }
}

export default new OTPService();

import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import {
  validateUserRegistration,
  validateUserLogin,
  validateAdminLogin,
  validateRefreshToken,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  validateEmailVerification,
  validateAdminRegistration,
  validateForgotPin,
} from "../validations/auth.validation";
import logger from "../utils/logger";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";

const authService = new AuthService();

export class AuthController {
  // User Registration
  async registerUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validationResult = validateUserRegistration(req.body);
      if (validationResult.error) {
        const errorMessage =
          validationResult.error.details?.[0]?.message || "Validation failed";
        throw new APIError(errorMessage, HttpStatus.BAD_REQUEST);
      }

      if (!validationResult.value) {
        throw new APIError("Validation failed", HttpStatus.BAD_REQUEST);
      }

      const result = await authService.registerUser(validationResult.value);

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "User registered successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // User Login
  async loginUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validationResult = validateUserLogin(req.body);
      if (validationResult.error) {
        const errorMessage =
          validationResult.error.details?.[0]?.message || "Validation failed";
        throw new APIError(errorMessage, HttpStatus.BAD_REQUEST);
      }

      if (!validationResult.value) {
        throw new APIError("Validation failed", HttpStatus.BAD_REQUEST);
      }

      const result = await authService.loginUser(
        validationResult.value.phone,
        validationResult.value.password
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "User logged in successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin Login
  async loginAdmin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validationResult = validateAdminLogin(req.body);
      if (validationResult.error) {
        const errorMessage =
          validationResult.error.details?.[0]?.message || "Validation failed";
        throw new APIError(errorMessage, HttpStatus.BAD_REQUEST);
      }

      if (!validationResult.value) {
        throw new APIError("Validation failed", HttpStatus.BAD_REQUEST);
      }

      const result = await authService.loginAdmin(
        validationResult.value.email,
        validationResult.value.password
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Admin logged in successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Refresh Token
  async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validationResult = validateRefreshToken(req.body);
      if (validationResult.error) {
        const errorMessage =
          validationResult.error.details?.[0]?.message || "Validation failed";
        throw new APIError(errorMessage, HttpStatus.BAD_REQUEST);
      }

      if (!validationResult.value) {
        throw new APIError("Validation failed", HttpStatus.BAD_REQUEST);
      }

      const result = await authService.refreshToken(
        validationResult.value.refreshToken,
        validationResult.value.role
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Token refreshed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Forgot Password
  async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validationResult = validateForgotPassword(req.body);
      if (validationResult.error) {
        const errorMessage =
          validationResult.error.details?.[0]?.message || "Validation failed";
        throw new APIError(errorMessage, HttpStatus.BAD_REQUEST);
      }

      if (!validationResult.value) {
        throw new APIError("Validation failed", HttpStatus.BAD_REQUEST);
      }

      await authService.forgotPassword(validationResult.value.email);

      res.status(HttpStatus.OK).json({
        success: true,
        message:
          "If an account with that email exists, a password reset OTP has been sent",
      });
    } catch (error) {
      next(error);
    }
  }

  // Reset Password
  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validationResult = validateResetPassword(req.body);
      if (validationResult.error) {
        const errorMessage =
          validationResult.error.details?.[0]?.message || "Validation failed";
        throw new APIError(errorMessage, HttpStatus.BAD_REQUEST);
      }

      if (!validationResult.value) {
        throw new APIError("Validation failed", HttpStatus.BAD_REQUEST);
      }

      await authService.resetPassword(
        validationResult.value.email,
        validationResult.value.otp,
        validationResult.value.newPassword
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify Email
  async verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validationResult = validateEmailVerification(req.body);
      if (validationResult.error) {
        const errorMessage =
          validationResult.error.details?.[0]?.message || "Validation failed";
        throw new APIError(errorMessage, HttpStatus.BAD_REQUEST);
      }

      if (!validationResult.value) {
        throw new APIError("Validation failed", HttpStatus.BAD_REQUEST);
      }

      await authService.verifyEmail(
        validationResult.value.email,
        validationResult.value.otp
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Resend Email Verification OTP
  async resendEmailVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Get user ID from authenticated token
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError("User not authenticated", HttpStatus.UNAUTHORIZED);
      }

      await authService.resendEmailVerification(userId);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Email verification OTP sent successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user || req.admin;
      if (!user) {
        throw new APIError("User not authenticated", HttpStatus.UNAUTHORIZED);
      }

      const userType = req.user ? "user" : "admin";
      await authService.logout(user.id, userType);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Profile
  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user || req.admin;
      if (!user) {
        throw new APIError("User not authenticated", HttpStatus.UNAUTHORIZED);
      }

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Profile retrieved successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Session Information
  async getSessionInfo(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user || req.admin;
      if (!user) {
        throw new APIError("User not authenticated", HttpStatus.UNAUTHORIZED);
      }

      const userType = req.user ? "user" : "admin";
      const sessionInfo = await authService.getSessionInfo(user.id, userType);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Session information retrieved successfully",
        data: sessionInfo,
      });
    } catch (error) {
      next(error);
    }
  }

  // Validate PIN
  async validatePin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { pin } = req.body;

      if (!pin) {
        throw new APIError("PIN is required", HttpStatus.BAD_REQUEST);
      }

      const userId = req.user?.id;
      if (!userId) {
        throw new APIError("User not authenticated", HttpStatus.UNAUTHORIZED);
      }

      const result = await authService.validatePin(userId, pin);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "PIN validated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Change Password
  async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validationResult = validateChangePassword(req.body);
      if (validationResult.error) {
        const errorMessage =
          validationResult.error.details?.[0]?.message || "Validation failed";
        throw new APIError(errorMessage, HttpStatus.BAD_REQUEST);
      }

      if (!validationResult.value) {
        throw new APIError("Validation failed", HttpStatus.BAD_REQUEST);
      }

      const userId = req.user?.id;
      if (!userId) {
        throw new APIError("User not authenticated", HttpStatus.UNAUTHORIZED);
      }

      const result = await authService.changePassword(
        userId,
        validationResult.value.currentPassword,
        validationResult.value.newPassword
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Password changed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Change PIN
  async changePin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { currentPin, newPin } = req.body;

      if (!currentPin || !newPin) {
        throw new APIError(
          "Current PIN and new PIN are required",
          HttpStatus.BAD_REQUEST
        );
      }

      const userId = req.user?.id;
      if (!userId) {
        throw new APIError("User not authenticated", HttpStatus.UNAUTHORIZED);
      }

      const result = await authService.changePin(userId, currentPin, newPin);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "PIN changed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Forgot PIN - Reset PIN using current password
  async forgotPin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validationResult = validateForgotPin(req.body);
      if (validationResult.error) {
        const errorMessage =
          validationResult.error.details?.[0]?.message || "Validation failed";
        throw new APIError(errorMessage, HttpStatus.BAD_REQUEST);
      }

      if (!validationResult.value) {
        throw new APIError("Validation failed", HttpStatus.BAD_REQUEST);
      }

      const userId = req.user?.id;
      if (!userId) {
        throw new APIError("User not authenticated", HttpStatus.UNAUTHORIZED);
      }

      const result = await authService.forgotPin(
        userId,
        validationResult.value.currentPassword,
        validationResult.value.newPin
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "PIN reset successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Health Check
  async healthCheck(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Auth service is healthy",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  // Register Admin
  async registerAdmin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validationResult = validateAdminRegistration(req.body);
      if (validationResult.error) {
        const errorMessage =
          validationResult.error.details?.[0]?.message || "Validation failed";
        throw new APIError(errorMessage, HttpStatus.BAD_REQUEST);
      }

      if (!validationResult.value) {
        throw new APIError("Validation failed", HttpStatus.BAD_REQUEST);
      }

      const result = await authService.registerAdmin(validationResult.value);

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Admin registered successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();

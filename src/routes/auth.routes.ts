import { Router } from "express";
import authController from "../controllers/auth.controller";
import {
  authenticateUser,
  authenticateAdmin,
  authenticateSuperAdmin,
} from "../middlewares/auth.middleware";

const router = Router();

// Public user auth
router.post("/register", (req, res, next) =>
  authController.registerUser(req, res, next)
);
router.post("/login", (req, res, next) =>
  authController.loginUser(req, res, next)
);

// Public admin auth
router.post("/admin/login", (req, res, next) =>
  authController.loginAdmin(req, res, next)
);

// Admin registration (public - for super admin creation)
router.post("/admin/register", (req, res, next) =>
  authController.registerAdmin(req, res, next)
);

// Token
router.post("/refresh", (req, res, next) =>
  authController.refreshToken(req, res, next)
);

// Password reset
router.post("/request-password-reset", (req, res, next) =>
  authController.forgotPassword(req, res, next)
);
router.post("/reset-password", (req, res, next) =>
  authController.resetPassword(req, res, next)
);

// Email verification
router.post("/verify-email", (req, res, next) =>
  authController.verifyEmail(req, res, next)
);

// Resend email verification OTP (authenticated users only)
router.post("/resend-verification", authenticateUser, (req, res, next) =>
  authController.resendEmailVerification(req, res, next)
);

// Logout (separate endpoints for user/admin)
router.post("/logout", authenticateUser, (req, res, next) =>
  authController.logout(req, res, next)
);
router.post("/admin/logout", authenticateAdmin, (req, res, next) =>
  authController.logout(req, res, next)
);

// Profile (separate endpoints for user/admin)
router.get("/profile", authenticateUser, (req, res, next) =>
  authController.getProfile(req, res, next)
);
router.get("/admin/profile", authenticateAdmin, (req, res, next) =>
  authController.getProfile(req, res, next)
);

// Session information (separate endpoints for user/admin)
router.get("/session", authenticateUser, (req, res, next) =>
  authController.getSessionInfo(req, res, next)
);
router.get("/admin/session", authenticateAdmin, (req, res, next) =>
  authController.getSessionInfo(req, res, next)
);

// Password operations (user)
router.post("/change-password", authenticateUser, (req, res, next) =>
  authController.changePassword(req, res, next)
);

// PIN operations (user)
router.post("/pin/validate", authenticateUser, (req, res, next) =>
  authController.validatePin(req, res, next)
);
router.post("/pin/change", authenticateUser, (req, res, next) =>
  authController.changePin(req, res, next)
);

// Health
router.get("/health", (req, res, next) =>
  authController.healthCheck(req, res, next)
);

export default router;

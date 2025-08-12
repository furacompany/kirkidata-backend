import { Router } from "express";
import adminController from "../controllers/admin.controller";
import { authenticateAdmin } from "../middlewares/auth.middleware";

const router = Router();

// Admin self
router.get("/me", authenticateAdmin, (req, res, next) =>
  adminController.getCurrentAdminProfile(req, res, next)
);
router.patch("/me", authenticateAdmin, (req, res, next) =>
  adminController.updateAdminProfile(req, res, next)
);
router.post("/me/change-password", authenticateAdmin, (req, res, next) =>
  adminController.changeAdminPassword(req, res, next)
);

// Health
router.get("/health", (req, res, next) =>
  adminController.healthCheck(req, res, next)
);

export default router;

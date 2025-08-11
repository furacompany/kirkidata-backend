import { Router } from "express";
import adminController from "../controllers/admin.controller";
import {
  authenticateAdmin,
  requireSuperAdmin,
} from "../middlewares/auth.middleware";

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

// Admin management (super admin for sensitive ops)
router.get("/:adminId", authenticateAdmin, (req, res, next) =>
  adminController.getAdminById(req, res, next)
);
router.get("/email/:email", authenticateAdmin, (req, res, next) =>
  adminController.getAdminByEmail(req, res, next)
);
router.patch("/:adminId", authenticateAdmin, (req, res, next) =>
  adminController.updateAdminProfile(req, res, next)
);
router.get("/", authenticateAdmin, (req, res, next) =>
  adminController.searchAdmins(req, res, next)
);
router.get("/stats/aggregate", authenticateAdmin, (req, res, next) =>
  adminController.getAdminStats(req, res, next)
);
router.get("/dashboard/stats", authenticateAdmin, (req, res, next) =>
  adminController.getDashboardStats(req, res, next)
);
router.post("/bulk", authenticateAdmin, (req, res, next) =>
  adminController.bulkOperation(req, res, next)
);
router.post("/:adminId/deactivate", authenticateAdmin, (req, res, next) =>
  adminController.deactivateAdmin(req, res, next)
);
router.post("/:adminId/reactivate", authenticateAdmin, (req, res, next) =>
  adminController.reactivateAdmin(req, res, next)
);
router.delete("/:adminId", authenticateAdmin, (req, res, next) =>
  adminController.deleteAdmin(req, res, next)
);

// Activity log
router.get("/activity/logs", authenticateAdmin, (req, res, next) =>
  adminController.getAdminActivityLog(req, res, next)
);

// Health
router.get("/health", (req, res, next) =>
  adminController.healthCheck(req, res, next)
);

export default router;

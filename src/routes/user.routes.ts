import { Router } from "express";
import userController from "../controllers/user.controller";
import {
  authenticateUser,
  authenticateAdmin,
} from "../middlewares/auth.middleware";

const router = Router();

// User self endpoints
router.get("/me", authenticateUser, (req, res, next) =>
  userController.getCurrentUserProfile(req, res, next)
);
router.patch("/me", authenticateUser, (req, res, next) =>
  userController.updateUserProfile(req, res, next)
);
router.get("/me/wallet", authenticateUser, (req, res, next) =>
  userController.getUserWalletBalance(req, res, next)
);

// Admin-only user management
router.get("/:userId", authenticateAdmin, (req, res, next) =>
  userController.getUserById(req, res, next)
);
router.get("/phone/:phone", authenticateAdmin, (req, res, next) =>
  userController.getUserByPhone(req, res, next)
);
router.get("/email/:email", authenticateAdmin, (req, res, next) =>
  userController.getUserByEmail(req, res, next)
);
router.patch("/:userId", authenticateAdmin, (req, res, next) =>
  userController.updateUserProfile(req, res, next)
);
router.post("/:userId/wallet", authenticateAdmin, (req, res, next) =>
  userController.updateWalletBalance(req, res, next)
);
router.get("/", authenticateAdmin, (req, res, next) =>
  userController.searchUsers(req, res, next)
);
router.get("/stats/aggregate", authenticateAdmin, (req, res, next) =>
  userController.getUserStats(req, res, next)
);
router.post("/bulk", authenticateAdmin, (req, res, next) =>
  userController.bulkOperation(req, res, next)
);
router.post("/:userId/deactivate", authenticateAdmin, (req, res, next) =>
  userController.deactivateUser(req, res, next)
);
router.post("/:userId/reactivate", authenticateAdmin, (req, res, next) =>
  userController.reactivateUser(req, res, next)
);
router.delete("/:userId", authenticateAdmin, (req, res, next) =>
  userController.deleteUser(req, res, next)
);

// Health
router.get("/health", (req, res, next) =>
  userController.healthCheck(req, res, next)
);

export default router;

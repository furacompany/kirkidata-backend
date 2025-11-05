import { Router } from "express";
import aychindodataController from "../controllers/aychindodata.controller";
import { authenticateAdmin } from "../middlewares/auth.middleware";

const router = Router();

// Aychindodata user info and wallet (admin only)
router.get("/user", authenticateAdmin, (req, res, next) =>
  aychindodataController.getUserInfo(req, res, next)
);

// Networks (admin only)
router.get("/networks", authenticateAdmin, (req, res, next) =>
  aychindodataController.getNetworks(req, res, next)
);

// Health check endpoint
router.get("/health", (req, res, next) =>
  aychindodataController.healthCheck(req, res, next)
);

// Debug endpoint (admin only) - to test Aychindodata connection
router.get("/debug", authenticateAdmin, (req, res, next) =>
  aychindodataController.debugConnection(req, res, next)
);

// Sync networks to database (admin only)
router.post("/sync/networks", authenticateAdmin, (req, res, next) =>
  aychindodataController.syncNetworks(req, res, next)
);

export default router;


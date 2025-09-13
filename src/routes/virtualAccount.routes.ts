import { Router } from "express";
import virtualAccountController from "../controllers/virtualAccount.controller";
import { authenticateUser } from "../middlewares/auth.middleware";

const router = Router();

// User virtual account endpoints (authenticated)
router.post("/", authenticateUser, (req, res, next) =>
  virtualAccountController.createVirtualAccount(req, res, next)
);

router.get("/", authenticateUser, (req, res, next) =>
  virtualAccountController.getUserVirtualAccount(req, res, next)
);

router.get("/available-banks", authenticateUser, (req, res, next) =>
  virtualAccountController.getAvailableBanks(req, res, next)
);

router.get("/transactions", authenticateUser, (req, res, next) =>
  virtualAccountController.getUserTransactions(req, res, next)
);

router.get("/:accountId", authenticateUser, (req, res, next) =>
  virtualAccountController.getVirtualAccountById(req, res, next)
);

router.get("/:accountId/transactions", authenticateUser, (req, res, next) =>
  virtualAccountController.getVirtualAccountWithTransactions(req, res, next)
);

router.post("/kyc/upgrade", authenticateUser, (req, res, next) =>
  virtualAccountController.upgradeVirtualAccountKYC(req, res, next)
);

// Public webhook endpoint (no authentication required)
// Note: PalmPay webhook is handled by a separate controller

// Health check endpoint
router.get("/health", (req, res, next) =>
  virtualAccountController.healthCheck(req, res, next)
);

export default router;

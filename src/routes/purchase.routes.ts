import { Router } from "express";
import purchaseController from "../controllers/purchase.controller";
import { authenticateUser } from "../middlewares/auth.middleware";

const router = Router();

// User browsing endpoints (authenticated)
router.get("/networks", authenticateUser, (req, res, next) =>
  purchaseController.getNetworks(req, res, next)
);

router.get(
  "/data-plans/network/:networkName/categories",
  authenticateUser,
  (req, res, next) => purchaseController.getDataPlanCategories(req, res, next)
);

router.get(
  "/data-plans/network/:networkName",
  authenticateUser,
  (req, res, next) => purchaseController.getDataPlans(req, res, next)
);

router.get(
  "/data-plans/network/:networkName/category/:planType",
  authenticateUser,
  (req, res, next) => purchaseController.getDataPlansByCategory(req, res, next)
);

router.get("/airtime/pricing", authenticateUser, (req, res, next) =>
  purchaseController.getAirtimePricing(req, res, next)
);

// User purchase endpoints (authenticated)
router.post("/airtime", authenticateUser, (req, res, next) =>
  purchaseController.buyAirtime(req, res, next)
);

router.post("/data", authenticateUser, (req, res, next) =>
  purchaseController.buyData(req, res, next)
);

router.get("/transactions", authenticateUser, (req, res, next) =>
  purchaseController.getUserTransactions(req, res, next)
);

router.get(
  "/transactions/:transactionId/status",
  authenticateUser,
  (req, res, next) => purchaseController.checkTransactionStatus(req, res, next)
);

// Health check endpoint
router.get("/health", (req, res, next) =>
  purchaseController.healthCheck(req, res, next)
);

export default router;

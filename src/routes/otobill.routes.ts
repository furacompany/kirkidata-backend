/**
 * @deprecated This file is deprecated. OTOBill routes have been replaced by Aychindodata routes.
 * This file is kept for reference only. Use src/routes/aychindodata.routes.ts instead.
 * 
 * Migration completed: All functionality has been moved to Aychindodata API.
 * This file will be removed in a future version.
 * 
 * NOTE: These routes are no longer registered in api.routes.ts
 */

import { Router } from "express";
import otobillController from "../controllers/otobill.controller";
import { authenticateAdmin } from "../middlewares/auth.middleware";

const router = Router();

// OtoBill profile and wallet (admin only)
router.get("/profile", authenticateAdmin, (req, res, next) =>
  otobillController.getProfile(req, res, next)
);

router.get("/wallet/balance", authenticateAdmin, (req, res, next) =>
  otobillController.getWalletBalance(req, res, next)
);

// Network and data plan information (admin only)
router.get("/networks", authenticateAdmin, (req, res, next) =>
  otobillController.getNetworks(req, res, next)
);

router.get(
  "/data-plans/network/:networkName",
  authenticateAdmin,
  (req, res, next) => otobillController.getDataPlans(req, res, next)
);

router.get(
  "/data-plans/network/:networkName/types",
  authenticateAdmin,
  (req, res, next) => otobillController.getDataPlanTypes(req, res, next)
);

router.get(
  "/data-plans/network/:networkName/type/:planType",
  authenticateAdmin,
  (req, res, next) => otobillController.getDataPlansByType(req, res, next)
);

// Sync operations (admin only)
router.post("/sync/data-plans", authenticateAdmin, (req, res, next) =>
  otobillController.syncDataPlans(req, res, next)
);

router.post("/sync/airtime-pricing", authenticateAdmin, (req, res, next) =>
  otobillController.syncAirtimePricing(req, res, next)
);

// Pricing management (admin only)
router.get("/pricing/summary", authenticateAdmin, (req, res, next) =>
  otobillController.getPricingSummary(req, res, next)
);

router.get("/data-plans/pricing", authenticateAdmin, (req, res, next) =>
  otobillController.getDataPlansWithPricing(req, res, next)
);

router.get("/airtime/pricing", authenticateAdmin, (req, res, next) =>
  otobillController.getAirtimePricing(req, res, next)
);

router.patch(
  "/data-plans/:planId/pricing",
  authenticateAdmin,
  (req, res, next) => otobillController.updateDataPlanPricing(req, res, next)
);

router.patch(
  "/airtime/:networkName/pricing",
  authenticateAdmin,
  (req, res, next) => otobillController.updateAirtimePricing(req, res, next)
);

// Transaction management (admin only)
router.get("/transactions", authenticateAdmin, (req, res, next) =>
  otobillController.getTransactions(req, res, next)
);

router.get(
  "/transactions/:transactionId",
  authenticateAdmin,
  (req, res, next) => otobillController.getTransaction(req, res, next)
);

// Statistics (admin only)
router.get("/stats/transactions", authenticateAdmin, (req, res, next) =>
  otobillController.getTransactionStats(req, res, next)
);

// Health check endpoint
router.get("/health", (req, res, next) =>
  otobillController.healthCheck(req, res, next)
);

export default router;

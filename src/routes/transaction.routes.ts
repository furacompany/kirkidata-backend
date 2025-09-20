import { Router } from "express";
import transactionController from "../controllers/transaction.controller";
import { authenticateAdmin } from "../middlewares/auth.middleware";

const router = Router();

// All transaction routes require admin authentication
router.use(authenticateAdmin);

// Get all transactions with filtering
router.get("/", (req, res, next) =>
  transactionController.getAllTransactions(req, res, next)
);

// Get transaction statistics
router.get("/stats", (req, res, next) =>
  transactionController.getTransactionStats(req, res, next)
);

// Get user transactions by user ID (admin only)
router.get("/user/:userId", (req, res, next) =>
  transactionController.getAdminUserTransactions(req, res, next)
);

// Get specific transaction by ID
router.get("/:transactionId", (req, res, next) =>
  transactionController.getTransactionById(req, res, next)
);

// Health check endpoint
router.get("/health", (req, res, next) =>
  transactionController.healthCheck(req, res, next)
);

export default router;

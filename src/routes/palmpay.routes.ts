import { Router } from "express";
import { handlePalmPayWebhook } from "../controllers/palmpay.controller";

const router = Router();

// PalmPay webhook endpoint (public, no authentication required)
router.post("/webhook", handlePalmPayWebhook);

export default router;

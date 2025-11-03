import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import adminRoutes from "./admin.routes";
import virtualAccountRoutes from "./virtualAccount.routes";
import purchaseRoutes from "./purchase.routes";
// DEPRECATED: OTOBill routes - kept for reference but not actively used
// import otobillRoutes from "./otobill.routes";
import aychindodataRoutes from "./aychindodata.routes";
import dataPlanRoutes from "./dataPlan.routes";
import transactionRoutes from "./transaction.routes";
import palmpayRoutes from "./palmpay.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/admins", adminRoutes);
router.use("/virtual-accounts", virtualAccountRoutes);
router.use("/purchases", purchaseRoutes);
// DEPRECATED: OTOBill integration - replaced by Aychindodata
// router.use("/otobill", otobillRoutes);
router.use("/aychindodata", aychindodataRoutes);
router.use("/data-plans", dataPlanRoutes);
router.use("/transactions", transactionRoutes);
router.use("/palmpay", palmpayRoutes);

export default router;

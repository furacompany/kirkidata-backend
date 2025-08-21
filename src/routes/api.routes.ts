import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import adminRoutes from "./admin.routes";
import virtualAccountRoutes from "./virtualAccount.routes";
import purchaseRoutes from "./purchase.routes";
import otobillRoutes from "./otobill.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/admins", adminRoutes);
router.use("/virtual-accounts", virtualAccountRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/otobill", otobillRoutes);

export default router;

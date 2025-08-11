import { Router } from "express";
import apiRoutes from "./api.routes";
import healthRoute from "./health.route";

const router = Router();

// Health check endpoint
router.use("/health", healthRoute);

// API v1 routes
router.use("/api/v1", apiRoutes);

// Root info
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "KirkiData API",
    versions: ["/api/v1"],
    docs: null,
    timestamp: new Date().toISOString(),
  });
});

export default router;

import { Router } from "express";
import nodemailerConfig from "../configs/nodemailer";

const router = Router();

router.get("/", async (req, res) => {
  try {
    // Check email service status
    const emailStatus = await nodemailerConfig.verifyConnection();

    res.status(200).json({
      success: true,
      message: "KirkiData Backend is healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      services: {
        database: "connected", // MongoDB connection is checked at startup
        email: emailStatus ? "connected" : "disconnected",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Health check failed",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Dedicated email health check
router.get("/email", async (req, res) => {
  try {
    const emailStatus = await nodemailerConfig.verifyConnection();

    res.status(200).json({
      success: true,
      message: emailStatus
        ? "Email service is healthy"
        : "Email service is not responding",
      timestamp: new Date().toISOString(),
      email: {
        status: emailStatus ? "connected" : "disconnected",
        host: process.env.EMAIL_HOST || "smtp.zoho.com",
        port: process.env.EMAIL_PORT || "465",
        secure: process.env.EMAIL_SECURE === "true",
        user: process.env.EMAIL_USER ? "configured" : "not configured",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Email health check failed",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;

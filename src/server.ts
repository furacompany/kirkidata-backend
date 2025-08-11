// server.ts
import app from "./app";
import dotenv from "dotenv";
import connectDB from "./configs/database";
import nodemailerConfig from "./configs/nodemailer";
import logger from "./utils/logger";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Verify email connection
    const emailConnectionSuccess = await nodemailerConfig.verifyConnection();
    if (emailConnectionSuccess) {
      logger.info("✅ Email service connected successfully");
    } else {
      logger.warn("⚠️ Email service connection failed - emails may not work");
    }

    // Startup summary
    logger.info("🚀 Starting KirkiData Backend...");
    logger.info("📊 Service Status:");
    logger.info("   • MongoDB: ✅ Connected");
    logger.info(
      `   • Email: ${emailConnectionSuccess ? "✅ Connected" : "❌ Failed"}`
    );
    logger.info(`   • Environment: ${process.env.NODE_ENV || "development"}`);

    app.listen(PORT, () => {
      logger.info(`🌐 Server running on http://localhost:${PORT}`);
      logger.info("🎉 KirkiData Backend is ready!");
    });
  } catch (err) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }
};

// Global safety nets
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

startServer();

import { Request, Response, NextFunction } from "express";
import aychindodataService from "../services/aychindodata.service";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";

class AychindodataController {
  // Get Aychindodata user info and wallet balance
  async getUserInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const userInfo = await aychindodataService.getUserInfo();

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Aychindodata user info retrieved successfully",
        data: userInfo,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get available networks
  async getNetworks(req: Request, res: Response, next: NextFunction) {
    try {
      const networks = await aychindodataService.getNetworks();

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Networks retrieved successfully",
        data: networks,
      });
    } catch (error) {
      next(error);
    }
  }

  // Health check endpoint
  async healthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const isConfigured = aychindodataService.isConfigured();
      const config = aychindodataService.getConfig();

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Aychindodata service is healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        aychindodata: {
          configured: isConfigured,
          baseURL: config.baseURL,
          hasUsername: config.hasUsername,
          hasPassword: config.hasPassword,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AychindodataController();


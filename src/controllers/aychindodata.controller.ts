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
          usingStaticToken: config.usingStaticToken,
          hasStaticToken: config.hasStaticToken,
          hasUsername: config.hasUsername,
          hasPassword: config.hasPassword,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Debug endpoint to test Aychindodata connection
  async debugConnection(req: Request, res: Response, next: NextFunction) {
    try {
      const config = aychindodataService.getConfig();
      
      // Try to get user info and see what happens
      let userInfo = null;
      let errorDetails = null;
      
      try {
        userInfo = await aychindodataService.getUserInfo();
      } catch (error: any) {
        errorDetails = {
          message: error.message,
          statusCode: error.statusCode,
          responseStatus: error.response?.status,
          responseData: error.response?.data,
          responseStatusText: error.response?.statusText,
        };
      }

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Aychindodata debug information",
        config: {
          baseURL: config.baseURL,
          usingStaticToken: config.usingStaticToken,
          hasStaticToken: config.hasStaticToken,
          hasUsername: config.hasUsername,
          hasPassword: config.hasPassword,
        },
        connectionTest: {
          success: !!userInfo,
          userInfo: userInfo,
          error: errorDetails,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Sync networks to database
  async syncNetworks(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await aychindodataService.syncNetworks();

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Networks synced successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AychindodataController();


import { Request, Response, NextFunction } from "express";
import purchaseService from "../services/purchase.service";
import DataPlanModel from "../models/dataPlan.model";
import AirtimeModel from "../models/airtime.model";
import { validateSchema } from "../validations/purchase.validation";
import {
  airtimePurchaseSchema,
  dataPurchaseSchema,
} from "../validations/purchase.validation";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import logger from "../utils/logger";

class PurchaseController {
  // Get available networks for users
  async getNetworks(req: Request, res: Response, next: NextFunction) {
    try {
      const networks = await purchaseService.getNetworks();

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Networks retrieved successfully",
        data: networks,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get data plan categories/types for a network
  async getDataPlanCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const { networkName } = req.params;

      if (!networkName) {
        throw new APIError("Network name is required", HttpStatus.BAD_REQUEST);
      }

      const categories = await purchaseService.getDataPlanCategories(
        networkName
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Data plan categories retrieved successfully",
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get data plans for users to browse
  async getDataPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const { networkName } = req.params;
      const {
        planType,
        page = 1,
        limit = 20,
        sortBy = "price",
        sortOrder = "asc",
      } = req.query;

      if (!networkName) {
        throw new APIError("Network name is required", HttpStatus.BAD_REQUEST);
      }

      const dataPlans = await purchaseService.getDataPlans(
        networkName,
        planType as string,
        parseInt(page as string),
        parseInt(limit as string),
        sortBy as string,
        sortOrder as string
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Data plans retrieved successfully",
        data: dataPlans,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get data plans by category for users
  async getDataPlansByCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { networkName, planType } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = "price",
        sortOrder = "asc",
      } = req.query;

      if (!networkName) {
        throw new APIError("Network name is required", HttpStatus.BAD_REQUEST);
      }

      if (!planType) {
        throw new APIError("Plan type is required", HttpStatus.BAD_REQUEST);
      }

      const dataPlans = await purchaseService.getDataPlansByCategory(
        networkName,
        planType,
        parseInt(page as string),
        parseInt(limit as string),
        sortBy as string,
        sortOrder as string
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Data plans retrieved successfully",
        data: dataPlans,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get airtime pricing for users
  async getAirtimePricing(req: Request, res: Response, next: NextFunction) {
    try {
      const pricing = await purchaseService.getAirtimePricing();

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Airtime pricing retrieved successfully",
        data: pricing,
      });
    } catch (error) {
      next(error);
    }
  }

  // Buy airtime
  async buyAirtime(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const validatedData = validateSchema(airtimePurchaseSchema, req.body);

      const result = await purchaseService.buyAirtime(userId, validatedData);

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Airtime purchase initiated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Buy data
  async buyData(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const validatedData = validateSchema(dataPurchaseSchema, req.body);

      const result = await purchaseService.buyData(userId, validatedData);

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Data purchase initiated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user transaction history
  async getUserTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { page = 1, limit = 10, type, status } = req.query;

      const transactions = await purchaseService.getUserTransactions(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        type as string,
        status as string
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "User transactions retrieved successfully",
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  // Check transaction status
  async checkTransactionStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = (req as any).user.id;
      const { transactionId } = req.params;

      if (!transactionId) {
        throw new APIError(
          "Transaction ID is required",
          HttpStatus.BAD_REQUEST
        );
      }

      const status = await purchaseService.checkTransactionStatus(
        userId,
        transactionId
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Transaction status retrieved successfully",
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  // Health check endpoint
  async healthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Purchase service is healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PurchaseController();

import { Request, Response, NextFunction } from "express";
import otobillService from "../services/otobill.service";
import DataPlanModel from "../models/dataPlan.model";
import AirtimeModel from "../models/airtime.model";
import TransactionModel from "../models/transaction.model";
import { validateSchema } from "../validations/purchase.validation";
import {
  dataPlanPricingSchema,
  airtimePricingSchema,
} from "../validations/purchase.validation";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import logger from "../utils/logger";

class OtoBillController {
  // Get OtoBill profile
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await otobillService.getProfile();

      res.status(HttpStatus.OK).json({
        success: true,
        message: "OtoBill profile retrieved successfully",
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get OtoBill wallet balance
  async getWalletBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const balance = await otobillService.getWalletBalance();

      res.status(HttpStatus.OK).json({
        success: true,
        message: "OtoBill wallet balance retrieved successfully",
        data: balance,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get available networks
  async getNetworks(req: Request, res: Response, next: NextFunction) {
    try {
      const networks = await otobillService.getNetworks();

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Networks retrieved successfully",
        data: networks,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get data plans for a network
  async getDataPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const { networkName } = req.params;
      const { planType, page = 1, limit = 20 } = req.query;

      if (!networkName) {
        throw new APIError("Network name is required", HttpStatus.BAD_REQUEST);
      }

      const dataPlans = await otobillService.getDataPlans(
        networkName,
        planType as string,
        parseInt(page as string),
        parseInt(limit as string)
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

  // Get data plan types for a network
  async getDataPlanTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const { networkName } = req.params;

      if (!networkName) {
        throw new APIError("Network name is required", HttpStatus.BAD_REQUEST);
      }

      const types = await otobillService.getDataPlanTypes(networkName);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Data plan types retrieved successfully",
        data: types,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get data plans by network and type
  async getDataPlansByType(req: Request, res: Response, next: NextFunction) {
    try {
      const { networkName, planType } = req.params;
      const { page = 1, limit = 20 } = req.query;

      if (!networkName) {
        throw new APIError("Network name is required", HttpStatus.BAD_REQUEST);
      }

      if (!planType) {
        throw new APIError("Plan type is required", HttpStatus.BAD_REQUEST);
      }

      const dataPlans = await otobillService.getDataPlansByType(
        networkName,
        planType,
        parseInt(page as string),
        parseInt(limit as string)
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

  // Sync data plans from OtoBill
  async syncDataPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await otobillService.syncDataPlans();

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Data plans sync completed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Sync airtime pricing from OtoBill
  async syncAirtimePricing(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await otobillService.syncAirtimePricing();

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Airtime pricing sync completed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get pricing summary
  async getPricingSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await otobillService.getPricingSummary();

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Pricing summary retrieved successfully",
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get OtoBill transaction history
  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const transactions = await otobillService.getTransactions(
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "OtoBill transactions retrieved successfully",
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get specific OtoBill transaction
  async getTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactionId } = req.params;

      if (!transactionId) {
        throw new APIError(
          "Transaction ID is required",
          HttpStatus.BAD_REQUEST
        );
      }

      const transaction = await otobillService.getTransaction(transactionId);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "OtoBill transaction retrieved successfully",
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update data plan pricing
  async updateDataPlanPricing(req: Request, res: Response, next: NextFunction) {
    try {
      const { planId } = req.params;
      const validatedData = validateSchema(dataPlanPricingSchema, req.body);

      if (!planId) {
        throw new APIError("Plan ID is required", HttpStatus.BAD_REQUEST);
      }

      const dataPlan = await DataPlanModel.findOne({ planId: planId }); // Use actual OtoBill planId
      if (!dataPlan) {
        throw new APIError("Data plan not found", HttpStatus.NOT_FOUND);
      }

      dataPlan.adminPrice = validatedData.adminPrice;

      // Update isActive if provided
      if (validatedData.isActive !== undefined) {
        dataPlan.isActive = validatedData.isActive;
      }

      await dataPlan.save();

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Data plan pricing updated successfully",
        data: {
          planId: dataPlan.planId, // Return actual OtoBill planId
          name: dataPlan.name,
          networkName: dataPlan.networkName,
          originalPrice: dataPlan.originalPrice || 0, // Handle undefined case
          adminPrice: dataPlan.adminPrice,
          profit: dataPlan.adminPrice - (dataPlan.originalPrice || 0), // Handle undefined case
          isActive: dataPlan.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Update airtime pricing
  async updateAirtimePricing(req: Request, res: Response, next: NextFunction) {
    try {
      const { networkName } = req.params;
      const validatedData = validateSchema(airtimePricingSchema, req.body);

      if (!networkName) {
        throw new APIError("Network name is required", HttpStatus.BAD_REQUEST);
      }

      const airtime = await AirtimeModel.findOne({ networkName });
      if (!airtime) {
        throw new APIError("Airtime pricing not found", HttpStatus.NOT_FOUND);
      }

      airtime.adminPrice = validatedData.adminPrice;
      await airtime.save();

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Airtime pricing updated successfully",
        data: {
          networkName: airtime.networkName,
          originalPrice: airtime.originalPrice,
          adminPrice: airtime.adminPrice,
          markup: airtime.adminPrice - airtime.originalPrice,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get data plans with admin pricing
  async getDataPlansWithPricing(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { networkName, planType, page = 1, limit = 20 } = req.query;

      const query: any = { isActive: true };
      if (networkName) query.networkName = networkName;
      if (planType) query.planType = planType;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [dataPlans, total] = await Promise.all([
        DataPlanModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit as string)),
        DataPlanModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / parseInt(limit as string));

      const plansWithPricing = dataPlans.map((plan) => ({
        planId: plan.planId, // Return actual OtoBill planId
        name: plan.name,
        networkName: plan.networkName,
        planType: plan.planType,
        validityDays: plan.validityDays,
        originalPrice: plan.originalPrice || 0, // Handle undefined case
        adminPrice: plan.adminPrice,
        profit: plan.adminPrice - (plan.originalPrice || 0), // Handle undefined case
        isActive: plan.isActive,
        lastSynced: plan.lastSynced,
      }));

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Data plans with pricing retrieved successfully",
        data: {
          plans: plansWithPricing,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            totalPages,
            hasNext: parseInt(page as string) < totalPages,
            hasPrev: parseInt(page as string) > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get airtime pricing
  async getAirtimePricing(req: Request, res: Response, next: NextFunction) {
    try {
      const airtimePricing = await AirtimeModel.find({ isActive: true }).sort({
        networkName: 1,
      });

      const pricing = airtimePricing.map((item) => ({
        networkName: item.networkName,
        originalPrice: item.originalPrice,
        adminPrice: item.adminPrice,
        markup: item.adminPrice - item.originalPrice,
        lastSynced: item.lastSynced,
      }));

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Airtime pricing retrieved successfully",
        data: pricing,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get transaction statistics
  async getTransactionStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, type } = req.query;

      let dateFilter: any = {};
      if (startDate && endDate) {
        dateFilter = {
          createdAt: {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string),
          },
        };
      }

      let typeFilter: any = {};
      if (type && type !== "all") {
        typeFilter.type = type;
      }

      const query = {
        ...dateFilter,
        ...typeFilter,
        type: { $in: ["airtime", "data"] },
      };

      const [
        totalTransactions,
        totalAmount,
        totalProfit,
        airtimeStats,
        dataStats,
      ] = await Promise.all([
        TransactionModel.countDocuments(query),
        TransactionModel.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        TransactionModel.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: "$profit" } } },
        ]),
        TransactionModel.aggregate([
          { $match: { ...query, type: "airtime" } },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              amount: { $sum: "$amount" },
              profit: { $sum: "$profit" },
            },
          },
        ]),
        TransactionModel.aggregate([
          { $match: { ...query, type: "data" } },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              amount: { $sum: "$amount" },
              profit: { $sum: "$profit" },
            },
          },
        ]),
      ]);

      const stats = {
        totalTransactions,
        totalAmount: totalAmount[0]?.total || 0,
        totalProfit: totalProfit[0]?.total || 0,
        airtime: {
          count: airtimeStats[0]?.count || 0,
          amount: airtimeStats[0]?.amount || 0,
          profit: airtimeStats[0]?.profit || 0,
        },
        data: {
          count: dataStats[0]?.count || 0,
          amount: dataStats[0]?.amount || 0,
          profit: dataStats[0]?.profit || 0,
        },
        period:
          startDate && endDate ? `${startDate} to ${endDate}` : "All time",
      };

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Transaction statistics retrieved successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // Health check endpoint
  async healthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const isConfigured = otobillService.isConfigured();

      res.status(HttpStatus.OK).json({
        success: true,
        message: "OtoBill service is healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        otobill: {
          configured: isConfigured,
          baseURL: otobillService.getConfig().baseURL,
          hasApiKey: !!otobillService.getConfig().apiKey,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new OtoBillController();

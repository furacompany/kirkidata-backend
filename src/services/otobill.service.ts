import otobillAPI from "../configs/otobill";
import DataPlanModel from "../models/dataPlan.model";
import AirtimeModel from "../models/airtime.model";
import TransactionModel from "../models/transaction.model";
import UserModel from "../models/user.model";
import logger from "../utils/logger";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";

class OtoBillService {
  // Get OtoBill profile
  async getProfile() {
    try {
      if (!otobillAPI.isConfigured()) {
        throw new APIError(
          "OtoBill API is not configured",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const profile = await otobillAPI.getProfile();
      return profile;
    } catch (error) {
      logger.error("Failed to get OtoBill profile:", error);
      throw error;
    }
  }

  // Get OtoBill wallet balance
  async getWalletBalance() {
    try {
      if (!otobillAPI.isConfigured()) {
        throw new APIError(
          "OtoBill API is not configured",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const balance = await otobillAPI.getWalletBalance();
      return balance;
    } catch (error) {
      logger.error("Failed to get OtoBill wallet balance:", error);
      throw error;
    }
  }

  // Get available networks (from local DB)
  async getNetworks() {
    try {
      // Get networks from local airtime records
      const airtimeRecords = await AirtimeModel.find({ isActive: true }).sort({
        networkName: 1,
      });

      const networks = airtimeRecords.map((record) => ({
        id: record._id.toString(),
        name: record.networkName,
        status: "On",
        isActive: record.isActive,
      }));

      return networks;
    } catch (error) {
      logger.error("Failed to get networks from local DB:", error);
      throw error;
    }
  }

  // Get data plans for a network (from local DB)
  async getDataPlans(
    networkName: string,
    planType?: string,
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const query: any = {
        networkName,
        isActive: true,
        isVisible: true,
      };

      if (planType) {
        query.planType = planType;
      }

      const skip = (page - 1) * limit;

      const [dataPlans, total] = await Promise.all([
        DataPlanModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        DataPlanModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      const plans = dataPlans.map((plan) => ({
        planId: plan.planId,
        id: plan.otobillId,
        name: plan.name,
        networkName: plan.networkName,
        planType: plan.planType,
        validityDays: plan.validityDays,
        originalPrice: plan.originalPrice || 0, // Handle undefined case
        price: plan.adminPrice, // Use admin price as the selling price
        formattedPrice: `₦${plan.adminPrice.toLocaleString()}`,
        profit: plan.adminPrice - (plan.originalPrice || 0), // Handle undefined case
        formattedProfit: `₦${(
          plan.adminPrice - (plan.originalPrice || 0)
        ).toLocaleString()}`,
      }));

      return {
        plans,
        total,
        page,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      logger.error("Failed to get data plans from local DB:", error);
      throw error;
    }
  }

  // Get data plan types for a network (from local DB)
  async getDataPlanTypes(networkName: string) {
    try {
      const types = await DataPlanModel.distinct("planType", {
        networkName,
        isActive: true,
        isVisible: true,
      });

      return types;
    } catch (error) {
      logger.error("Failed to get data plan types from local DB:", error);
      throw error;
    }
  }

  // Get data plans by network and type (from local DB)
  async getDataPlansByType(
    networkName: string,
    planType: string,
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const query = {
        networkName,
        planType,
        isActive: true,
        isVisible: true,
      };

      const skip = (page - 1) * limit;

      const [dataPlans, total] = await Promise.all([
        DataPlanModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        DataPlanModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      const plans = dataPlans.map((plan) => ({
        planId: plan.planId,
        id: plan.otobillId,
        name: plan.name,
        networkName: plan.networkName,
        planType: plan.planType,
        validityDays: plan.validityDays,
        originalPrice: plan.originalPrice || 0, // Handle undefined case
        price: plan.adminPrice, // Use admin price as the selling price
        formattedPrice: `₦${plan.adminPrice.toLocaleString()}`,
        profit: plan.adminPrice - (plan.originalPrice || 0), // Handle undefined case
        formattedProfit: `₦${(
          plan.adminPrice - (plan.originalPrice || 0)
        ).toLocaleString()}`,
      }));

      return {
        plans,
        total,
        page,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      logger.error("Failed to get data plans by type from local DB:", error);
      throw error;
    }
  }

  // Sync data plans from OtoBill
  async syncDataPlans() {
    try {
      if (!otobillAPI.isConfigured()) {
        throw new APIError(
          "OtoBill API is not configured",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const networks = await otobillAPI.getNetworks();
      let totalSynced = 0;
      let totalCreated = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;

      for (const network of networks) {
        if (!network.isActive) continue;

        try {
          // Get ALL data plans for this network by using a very high limit
          // This ensures we get all 78+ plans instead of just the first 20
          const dataPlans = await otobillAPI.getDataPlans(
            network.name,
            undefined,
            1,
            1000
          );

          for (const plan of dataPlans.plans) {
            try {
              // Check if plan already exists
              const existingPlan = await DataPlanModel.findOne({
                otobillId: plan.id,
              });

              if (existingPlan) {
                // Update existing plan
                existingPlan.name = plan.name;
                existingPlan.planType = plan.planType;
                existingPlan.validityDays = plan.validityDays;
                existingPlan.originalPrice = plan.price; // Use the new 'price' field
                // Don't update adminPrice - let admin keep their custom pricing
                existingPlan.lastSynced = new Date();

                await existingPlan.save();
                totalUpdated++;
              } else {
                // Create new plan
                const customId = `PLAN_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`;

                const newPlan = new DataPlanModel({
                  customId,
                  otobillId: plan.id,
                  planId: plan.planId,
                  name: plan.name,
                  networkName: plan.networkName,
                  planType: plan.planType,
                  validityDays: plan.validityDays,
                  originalPrice: plan.price, // Use the new 'price' field
                  adminPrice: plan.price, // Set admin price same as OtoBill price initially
                  isActive: true,
                  isVisible: true,
                  lastSynced: new Date(),
                });

                await newPlan.save();
                totalCreated++;
              }

              totalSynced++;
            } catch (planError) {
              logger.error(`Failed to sync plan ${plan.planId}:`, planError);
              totalSkipped++;
            }
          }
        } catch (networkError) {
          logger.error(`Failed to sync network ${network.name}:`, networkError);
        }
      }

      return {
        totalSynced,
        totalCreated,
        totalUpdated,
        totalSkipped,
        message: `Data plans sync completed. Created: ${totalCreated}, Updated: ${totalUpdated}, Skipped: ${totalSkipped}`,
      };
    } catch (error) {
      logger.error("Failed to sync data plans:", error);
      throw error;
    }
  }

  // Sync airtime pricing from OtoBill
  async syncAirtimePricing() {
    try {
      if (!otobillAPI.isConfigured()) {
        throw new APIError(
          "OtoBill API is not configured",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const networks = await otobillAPI.getNetworks();
      let totalSynced = 0;
      let totalCreated = 0;
      let totalUpdated = 0;

      for (const network of networks) {
        if (!network.isActive) continue;

        try {
          const existingAirtime = await AirtimeModel.findOne({
            networkName: network.name,
          });

          if (existingAirtime) {
            // Update existing airtime pricing
            existingAirtime.originalPrice = 0; // Airtime usually has no markup from OtoBill
            // Don't update adminPrice - let admin keep their custom pricing
            existingAirtime.lastSynced = new Date();

            await existingAirtime.save();
            totalUpdated++;
          } else {
            // Create new airtime pricing
            const newAirtime = new AirtimeModel({
              networkName: network.name,
              originalPrice: 0, // Airtime usually has no markup from OtoBill
              adminPrice: 0, // No markup for airtime initially
              isActive: network.isActive,
              lastSynced: new Date(),
            });

            await newAirtime.save();
            totalCreated++;
          }

          totalSynced++;
        } catch (networkError) {
          logger.error(
            `Failed to sync airtime pricing for ${network.name}:`,
            networkError
          );
        }
      }

      return {
        totalSynced,
        totalCreated,
        totalUpdated,
        message: `Airtime pricing sync completed. Created: ${totalCreated}, Updated: ${totalUpdated}`,
      };
    } catch (error) {
      logger.error("Failed to sync airtime pricing:", error);
      throw error;
    }
  }

  // Get pricing summary
  async getPricingSummary() {
    try {
      if (!otobillAPI.isConfigured()) {
        throw new APIError(
          "OtoBill API is not configured",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const summary = await otobillAPI.getPricingSummary();
      return summary;
    } catch (error) {
      logger.error("Failed to get OtoBill pricing summary:", error);
      throw error;
    }
  }

  // Get transaction history from OtoBill
  async getTransactions(page: number = 1, limit: number = 20) {
    try {
      if (!otobillAPI.isConfigured()) {
        throw new APIError(
          "OtoBill API is not configured",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const transactions = await otobillAPI.getTransactions(page, limit);
      return transactions;
    } catch (error) {
      logger.error("Failed to get OtoBill transactions:", error);
      throw error;
    }
  }

  // Get specific transaction from OtoBill
  async getTransaction(transactionId: string) {
    try {
      if (!otobillAPI.isConfigured()) {
        throw new APIError(
          "OtoBill API is not configured",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const transaction = await otobillAPI.getTransaction(transactionId);
      return transaction;
    } catch (error) {
      logger.error("Failed to get OtoBill transaction:", error);
      throw error;
    }
  }

  // Check transaction status
  async checkTransactionStatus(topupmateRef: string) {
    try {
      if (!otobillAPI.isConfigured()) {
        throw new APIError(
          "OtoBill API is not configured",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const status = await otobillAPI.checkTransactionStatus(topupmateRef);
      return status;
    } catch (error) {
      logger.error("Failed to check transaction status:", error);
      throw error;
    }
  }

  // Check if API is properly configured
  isConfigured(): boolean {
    return otobillAPI.isConfigured();
  }

  // Get configuration
  getConfig() {
    return otobillAPI.getConfig();
  }
}

export default new OtoBillService();

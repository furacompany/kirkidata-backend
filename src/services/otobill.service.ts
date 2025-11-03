/**
 * @deprecated This file is deprecated. OTOBill service has been replaced by Aychindodata service.
 * This file is kept for reference only. Use src/services/aychindodata.service.ts instead.
 * 
 * Migration completed: All functionality has been moved to Aychindodata API.
 * This file will be removed in a future version.
 */

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
      let totalDeactivated = 0;

      // Get all current plans to track which ones are no longer available
      const allCurrentPlans = await DataPlanModel.find({});
      const currentPlanIds = new Set(
        allCurrentPlans.map((plan) => plan.otobillId)
      );
      const syncedPlanIds = new Set<string>();

      for (const network of networks) {
        if (!network.isActive) continue;

        logger.info(`Syncing data plans for network: ${network.name}`);

        try {
          // Get all plan types for this network first
          const planTypes = await otobillAPI.getDataPlanTypes(network.name);
          logger.info(
            `Found ${planTypes.length} plan types for ${
              network.name
            }: ${planTypes.join(", ")}`
          );

          // Fetch plans for each type to ensure we get all plans
          for (const planType of planTypes) {
            try {
              logger.info(`Fetching ${planType} plans for ${network.name}`);

              // Get ALL data plans for this network and type
              const dataPlans = await otobillAPI.getDataPlansByType(
                network.name,
                planType,
                1,
                1000 // High limit to get all plans
              );

              logger.info(
                `Found ${dataPlans.plans.length} ${planType} plans for ${network.name}`
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

                    // Store the old original price for comparison
                    const oldOriginalPrice = existingPlan.originalPrice;

                    // Update originalPrice if it has changed from OtoBill
                    if (existingPlan.originalPrice !== plan.price) {
                      existingPlan.originalPrice = plan.price;

                      // If admin hasn't set a custom price (adminPrice equals old originalPrice),
                      // update adminPrice to match new OtoBill price
                      if (existingPlan.adminPrice === oldOriginalPrice) {
                        existingPlan.adminPrice = plan.price;
                      }
                    }

                    // Ensure the plan is active since it's available from OtoBill
                    existingPlan.isActive = true;
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
                      originalPrice: plan.price,
                      adminPrice: plan.price, // Set admin price same as OtoBill price initially
                      isActive: true, // Set to active by default
                      lastSynced: new Date(),
                    });

                    await newPlan.save();
                    totalCreated++;
                  }

                  syncedPlanIds.add(plan.id);
                  totalSynced++;
                } catch (planError) {
                  logger.error(
                    `Failed to sync plan ${plan.planId}:`,
                    planError
                  );
                  totalSkipped++;
                }
              }
            } catch (planTypeError) {
              logger.error(
                `Failed to sync plan type ${planType} for network ${network.name}:`,
                planTypeError
              );
            }
          }

          // Fallback: Also fetch all plans without type filtering to catch any missed plans
          try {
            const allNetworkPlans = await otobillAPI.getDataPlans(
              network.name,
              undefined,
              1,
              1000
            );

            for (const plan of allNetworkPlans.plans) {
              // Only process if we haven't already synced this plan
              if (!syncedPlanIds.has(plan.id)) {
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

                    // Store the old original price for comparison
                    const oldOriginalPrice = existingPlan.originalPrice;

                    // Update originalPrice if it has changed from OtoBill
                    if (existingPlan.originalPrice !== plan.price) {
                      existingPlan.originalPrice = plan.price;

                      // If admin hasn't set a custom price (adminPrice equals old originalPrice),
                      // update adminPrice to match new OtoBill price
                      if (existingPlan.adminPrice === oldOriginalPrice) {
                        existingPlan.adminPrice = plan.price;
                      }
                    }

                    // Ensure the plan is active since it's available from OtoBill
                    existingPlan.isActive = true;
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
                      originalPrice: plan.price,
                      adminPrice: plan.price, // Set admin price same as OtoBill price initially
                      isActive: true, // Set to active by default
                      lastSynced: new Date(),
                    });

                    await newPlan.save();
                    totalCreated++;
                  }

                  syncedPlanIds.add(plan.id);
                  totalSynced++;
                } catch (planError) {
                  logger.error(
                    `Failed to sync fallback plan ${plan.planId}:`,
                    planError
                  );
                  totalSkipped++;
                }
              }
            }
          } catch (fallbackError) {
            logger.error(
              `Failed to sync fallback plans for network ${network.name}:`,
              fallbackError
            );
          }
        } catch (networkError) {
          logger.error(`Failed to sync network ${network.name}:`, networkError);
        }
      }

      // Deactivate plans that are no longer available from OtoBill
      for (const planId of currentPlanIds) {
        if (!syncedPlanIds.has(planId)) {
          try {
            await DataPlanModel.updateOne(
              { otobillId: planId },
              {
                isActive: false,
                lastSynced: new Date(),
              }
            );
            totalDeactivated++;
          } catch (error) {
            logger.error(`Failed to deactivate plan ${planId}:`, error);
          }
        }
      }

      logger.info(
        `Data plans sync completed. Total synced: ${totalSynced}, Created: ${totalCreated}, Updated: ${totalUpdated}, Deactivated: ${totalDeactivated}, Skipped: ${totalSkipped}`
      );

      return {
        totalSynced,
        totalCreated,
        totalUpdated,
        totalSkipped,
        totalDeactivated,
        message: `Data plans sync completed. Created: ${totalCreated}, Updated: ${totalUpdated}, Deactivated: ${totalDeactivated}, Skipped: ${totalSkipped}`,
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

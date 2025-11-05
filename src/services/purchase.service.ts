import aychindodataService from "./aychindodata.service";
import DataPlanModel from "../models/dataPlan.model";
import AirtimeModel from "../models/airtime.model";
import TransactionModel from "../models/transaction.model";
import UserModel from "../models/user.model";
import logger from "../utils/logger";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import mongoose from "mongoose";

class PurchaseService {
  // Get available networks for users
  async getNetworks() {
    try {
      const airtimeRecords = await AirtimeModel.find({ isActive: true }).sort({
        networkName: 1,
      });

      const networks = airtimeRecords.map((record) => ({
        id: record.networkName, // Use network name as ID (MTN, AIRTEL, etc.)
        name: record.networkName,
        status: "On",
        isActive: record.isActive,
        airtimeMarkup: record.adminPrice, // Show admin markup for airtime
      }));

      return networks;
    } catch (error) {
      logger.error("Failed to get networks for users:", error);
      throw error;
    }
  }

  // Get data plan categories for a network
  async getDataPlanCategories(networkName: string) {
    try {
      const categories = await DataPlanModel.distinct("planType", {
        networkName,
        isActive: true,
      });

      return categories;
    } catch (error) {
      logger.error("Failed to get data plan categories:", error);
      throw error;
    }
  }

  // Get data plans for users to browse
  async getDataPlans(
    networkName: string,
    planType?: string,
    page: number = 1,
    limit: number = 20,
    sortBy: string = "price",
    sortOrder: string = "asc"
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

      // Build sort object
      const sortObject: any = {};
      if (sortBy === "price") {
        sortObject.adminPrice = sortOrder === "asc" ? 1 : -1;
      } else if (sortBy === "validity") {
        sortObject.validityDays = sortOrder === "asc" ? 1 : -1;
      } else if (sortBy === "name") {
        sortObject.name = sortOrder === "asc" ? 1 : -1;
      } else {
        sortObject.adminPrice = 1; // Default sort by price ascending
      }

      const [dataPlans, total] = await Promise.all([
        DataPlanModel.find(query).sort(sortObject).skip(skip).limit(limit),
        DataPlanModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      const plans = dataPlans.map((plan) => ({
        id: plan._id.toString(), // Use MongoDB _id as identifier
        planId: plan.planId, // Aychindodata plan ID (e.g., "9", "7", "8")
        name: plan.name,
        networkName: plan.networkName,
        planType: plan.planType,
        dataSize: plan.dataSize,
        validityDays: plan.validityDays,
        price: plan.adminPrice, // Show admin price to users
        formattedPrice: `₦${plan.adminPrice.toLocaleString()}`,
        description: `${plan.name} - ${plan.validityDays} days validity`,
      }));

      return {
        plans,
        total,
        page,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        filters: {
          networkName,
          planType: planType || "all",
          sortBy,
          sortOrder,
        },
      };
    } catch (error) {
      logger.error("Failed to get data plans for users:", error);
      throw error;
    }
  }

  // Get data plans by category for users
  async getDataPlansByCategory(
    networkName: string,
    planType: string,
    page: number = 1,
    limit: number = 20,
    sortBy: string = "price",
    sortOrder: string = "asc"
  ) {
    try {
      const query = {
        networkName,
        planType,
        isActive: true,
      };

      const skip = (page - 1) * limit;

      // Build sort object
      const sortObject: any = {};
      if (sortBy === "price") {
        sortObject.adminPrice = sortOrder === "asc" ? 1 : -1;
      } else if (sortBy === "validity") {
        sortObject.validityDays = sortOrder === "asc" ? 1 : -1;
      } else if (sortBy === "name") {
        sortObject.name = sortOrder === "asc" ? 1 : -1;
      } else {
        sortObject.adminPrice = 1; // Default sort by price ascending
      }

      const [dataPlans, total] = await Promise.all([
        DataPlanModel.find(query).sort(sortObject).skip(skip).limit(limit),
        DataPlanModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      const plans = dataPlans.map((plan) => ({
        id: plan._id.toString(), // Use MongoDB _id as identifier
        planId: plan.planId, // Aychindodata plan ID (e.g., "9", "7", "8")
        name: plan.name,
        networkName: plan.networkName,
        planType: plan.planType,
        dataSize: plan.dataSize,
        validityDays: plan.validityDays,
        price: plan.adminPrice, // Show admin price to users
        formattedPrice: `₦${plan.adminPrice.toLocaleString()}`,
        description: `${plan.name} - ${plan.validityDays} days validity`,
      }));

      return {
        plans,
        total,
        page,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        filters: {
          networkName,
          planType,
          sortBy,
          sortOrder,
        },
      };
    } catch (error) {
      logger.error("Failed to get data plans by category for users:", error);
      throw error;
    }
  }

  // Get airtime pricing for users
  async getAirtimePricing() {
    try {
      const airtimePricing = await AirtimeModel.find({ isActive: true }).sort({
        networkName: 1,
      });

      const pricing = airtimePricing.map((item) => ({
        networkName: item.networkName,
        markup: item.adminPrice, // Show admin markup to users
        formattedMarkup: `₦${item.adminPrice.toLocaleString()}`,
        note:
          item.adminPrice > 0
            ? `Additional ${item.adminPrice} markup per transaction`
            : "No additional charges",
      }));

      return pricing;
    } catch (error) {
      logger.error("Failed to get airtime pricing for users:", error);
      throw error;
    }
  }

  // Buy airtime
  async buyAirtime(userId: string, data: any) {
    try {
      // Check if user exists and has sufficient balance
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }

      // Get airtime pricing
      const airtime = await AirtimeModel.findOne({
        networkName: data.networkName,
        isActive: true,
      });

      if (!airtime) {
        throw new APIError("Network not available", HttpStatus.BAD_REQUEST);
      }

      // Calculate total cost (amount + markup)
      const totalCost = data.amount + airtime.adminPrice;

      // Check user balance
      if (user.wallet < totalCost) {
        throw new APIError(
          `Insufficient balance. Required: ₦${totalCost.toLocaleString()}, Available: ₦${user.wallet.toLocaleString()}`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Deduct from user wallet
      user.wallet -= totalCost;
      await user.save();

      // Generate unique request ID for Aychindodata
      const requestId = `Airtime_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create transaction record (profit will be calculated after Aychindodata response)
      const transaction = new TransactionModel({
        userId,
        type: "airtime",
        amount: totalCost,
        currency: "NGN",
        status: "pending",
        reference: requestId,
        description: `${data.networkName} airtime purchase for ${data.phoneNumber}`,
        networkName: data.networkName,
        phoneNumber: data.phoneNumber,
        profit: 0, // Will be calculated after Aychindodata response
      });

      await transaction.save();

      try {
        // Call Aychindodata API
        const aychindodataResponse = await aychindodataService.buyAirtime(
          data.networkName,
          data.phoneNumber,
          data.amount,
          requestId
        );

        // Calculate profit: User paid totalCost, Aychindodata charged amount (with discount)
        // The response shows: amount (requested), discount, and newbal (balance after)
        // Actual cost = amount - discount (or we can use: oldbal - newbal)
        const actualCost =
          aychindodataResponse.amount - (aychindodataResponse.discount || 0);
        const profit = totalCost - actualCost;

        // Update transaction with Aychindodata response
        transaction.status =
          aychindodataResponse.status === "success" ? "completed" : "failed";
        transaction.profit = Math.max(0, profit); // Ensure profit is not negative
        if (!transaction.metadata) {
          transaction.metadata = {};
        }
        transaction.metadata.aychindodataRequestId =
          aychindodataResponse["request-id"];
        transaction.metadata.aychindodataStatus = aychindodataResponse.status;
        transaction.metadata.aychindodataResponse = aychindodataResponse;
        transaction.metadata.actualAychindodataCost = actualCost;
        transaction.metadata.calculatedProfit = profit;
        transaction.metadata.oldBalance = aychindodataResponse.oldbal;
        transaction.metadata.newBalance = aychindodataResponse.newbal;

        await transaction.save();

        if (transaction.status === "failed") {
          // Refund user if failed
          user.wallet += totalCost;
          await user.save();
          throw new APIError(
            aychindodataResponse.message || "Airtime purchase failed",
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        }

        return {
          transactionId: transaction._id,
          reference: transaction.reference,
          amount: data.amount,
          markup: airtime.adminPrice,
          totalCost,
          actualCost,
          discount: aychindodataResponse.discount,
          profit: transaction.profit,
          status: "completed",
          description: transaction.description,
          networkName: data.networkName,
          phoneNumber: data.phoneNumber,
          requestId: aychindodataResponse["request-id"],
          message: aychindodataResponse.message,
        };
      } catch (aychindodataError: any) {
        // If Aychindodata fails, refund user and update transaction
        user.wallet += totalCost;
        await user.save();

        transaction.status = "failed";
        if (!transaction.metadata) {
          transaction.metadata = {};
        }
        transaction.metadata.aychindodataStatus = "failed";
        transaction.metadata.aychindodataResponse = aychindodataError;

        await transaction.save();

        logger.error(
          "Aychindodata airtime purchase failed:",
          aychindodataError
        );
        throw new APIError(
          aychindodataError.message ||
            "Airtime purchase failed. Your wallet has been refunded.",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    } catch (error) {
      logger.error("Failed to buy airtime:", error);
      throw error;
    }
  }

  // Buy data
  async buyData(userId: string, data: any) {
    try {
      // Check if user exists
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }

      // Get data plan by MongoDB _id or planId (Aychindodata plan ID)
      let dataPlan;
      if (!data.planId) {
        throw new APIError("planId is required", HttpStatus.BAD_REQUEST);
      }

      // Check if planId is a valid MongoDB ObjectId format (24 hex characters)
      const isValidObjectId = mongoose.Types.ObjectId.isValid(data.planId);

      if (isValidObjectId) {
        // Try to find by MongoDB _id first
        dataPlan = await DataPlanModel.findById(data.planId);
      }

      // If not found by _id, try by planId field (Aychindodata plan ID like "9", "7", "8", etc.)
      if (!dataPlan) {
        dataPlan = await DataPlanModel.findOne({
          planId: data.planId,
          isActive: true,
        });
      }

      if (!dataPlan || !dataPlan.isActive) {
        throw new APIError("Data plan not found", HttpStatus.NOT_FOUND);
      }

      // Check user balance
      if (user.wallet < dataPlan.adminPrice) {
        throw new APIError(
          `Insufficient balance. Required: ₦${dataPlan.adminPrice.toLocaleString()}, Available: ₦${user.wallet.toLocaleString()}`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Deduct from user wallet
      user.wallet -= dataPlan.adminPrice;
      await user.save();

      // Generate unique request ID for Aychindodata
      const requestId = `Data_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create transaction record
      const transaction = new TransactionModel({
        userId,
        type: "data",
        amount: dataPlan.adminPrice,
        currency: "NGN",
        status: "pending",
        reference: requestId,
        description: `${dataPlan.name} for ${data.phoneNumber}`,
        networkName: dataPlan.networkName,
        phoneNumber: data.phoneNumber,
        planId: dataPlan.planId,
        planName: dataPlan.name,
        profit: dataPlan.adminPrice - (dataPlan.originalPrice || 0), // Handle undefined case
      });

      await transaction.save();

      try {
        // Call Aychindodata API using the planId (convert to number for API)
        // The planId from our DB matches Aychindodata's plan ID (e.g., "9" -> 9)
        const aychindodataPlanId = Number(dataPlan.planId);

        if (isNaN(aychindodataPlanId)) {
          throw new APIError(
            `Invalid plan ID: "${dataPlan.planId}". Plan ID must be a numeric value.`,
            HttpStatus.BAD_REQUEST
          );
        }

        const aychindodataResponse = await aychindodataService.buyData(
          dataPlan.networkName,
          data.phoneNumber,
          aychindodataPlanId,
          requestId
        );

        // Calculate profit: User paid adminPrice, Aychindodata charged amount
        const actualCost = parseFloat(aychindodataResponse.amount);
        const profit = dataPlan.adminPrice - actualCost;

        // Update transaction with Aychindodata response
        transaction.status =
          aychindodataResponse.status === "success" ? "completed" : "failed";
        transaction.profit = Math.max(0, profit); // Ensure profit is not negative
        if (!transaction.metadata) {
          transaction.metadata = {};
        }
        transaction.metadata.aychindodataRequestId =
          aychindodataResponse["request-id"];
        transaction.metadata.aychindodataStatus = aychindodataResponse.status;
        transaction.metadata.aychindodataResponse = aychindodataResponse;
        transaction.metadata.actualAychindodataCost = actualCost;
        transaction.metadata.calculatedProfit = profit;
        transaction.metadata.oldBalance = aychindodataResponse.oldbal;
        transaction.metadata.newBalance = aychindodataResponse.newbal;
        transaction.metadata.dataplan = aychindodataResponse.dataplan;

        await transaction.save();

        if (transaction.status === "failed") {
          // Refund user if failed
          user.wallet += dataPlan.adminPrice;
          await user.save();
          throw new APIError(
            aychindodataResponse.message || "Data purchase failed",
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        }

        return {
          transactionId: transaction._id,
          reference: transaction.reference,
          amount: dataPlan.adminPrice,
          profit: transaction.profit,
          status: "completed",
          description: transaction.description,
          networkName: dataPlan.networkName,
          phoneNumber: data.phoneNumber,
          planId: dataPlan.planId,
          planName: dataPlan.name,
          dataSize: dataPlan.dataSize,
          requestId: aychindodataResponse["request-id"],
          message: aychindodataResponse.message,
        };
      } catch (aychindodataError: any) {
        // If Aychindodata fails, refund user and update transaction
        user.wallet += dataPlan.adminPrice;
        await user.save();

        transaction.status = "failed";
        if (!transaction.metadata) {
          transaction.metadata = {};
        }
        transaction.metadata.aychindodataStatus = "failed";
        transaction.metadata.aychindodataResponse = aychindodataError;

        await transaction.save();

        logger.error("Aychindodata data purchase failed:", aychindodataError);
        throw new APIError(
          aychindodataError.message ||
            "Data purchase failed. Your wallet has been refunded.",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    } catch (error) {
      logger.error("Failed to buy data:", error);
      throw error;
    }
  }

  // Get user transaction history
  async getUserTransactions(
    userId: string,
    page: number = 1,
    limit: number = 10,
    type?: string,
    status?: string
  ) {
    try {
      const query: any = {
        userId,
        type: { $in: ["airtime", "data", "funding", "debit"] },
      };

      if (type && type !== "all") {
        query.type = type;
      }

      if (status && status !== "all") {
        query.status = status;
      }

      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        TransactionModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        TransactionModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      const formattedTransactions = transactions.map((tx) => ({
        id: tx._id,
        type: tx.type,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        reference: tx.reference,
        description: tx.description,
        networkName: tx.networkName,
        phoneNumber: tx.phoneNumber,
        planId: tx.planId,
        planName: tx.planName,
        profit: tx.profit,
        relatedTransactionId: tx.relatedTransactionId,
        metadata: {
          chargeAmount: tx.metadata?.chargeAmount,
          originalFundingAmount: tx.metadata?.originalFundingAmount,
        },
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      }));

      return {
        transactions: formattedTransactions,
        total,
        page,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      logger.error("Failed to get user transactions:", error);
      throw error;
    }
  }

  // Check transaction status
  // Note: Aychindodata doesn't have a transaction status check endpoint
  // This method returns the current transaction status from our database
  async checkTransactionStatus(userId: string, transactionId: string) {
    try {
      const transaction = await TransactionModel.findOne({
        _id: transactionId,
        userId,
        type: { $in: ["airtime", "data"] },
      });

      if (!transaction) {
        throw new APIError("Transaction not found", HttpStatus.NOT_FOUND);
      }

      // Aychindodata doesn't provide a status check endpoint
      // The status is determined by the API response at purchase time
      // Return the current transaction status from our database

      return {
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        reference: transaction.reference,
        description: transaction.description,
        networkName: transaction.networkName,
        phoneNumber: transaction.phoneNumber,
        planId: transaction.planId,
        planName: transaction.planName,
        profit: transaction.profit,
        requestId: transaction.metadata?.aychindodataRequestId,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };
    } catch (error) {
      logger.error("Failed to check transaction status:", error);
      throw error;
    }
  }
}

export default new PurchaseService();

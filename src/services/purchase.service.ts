import otobillAPI from "../configs/otobill";
import DataPlanModel from "../models/dataPlan.model";
import AirtimeModel from "../models/airtime.model";
import TransactionModel from "../models/transaction.model";
import UserModel from "../models/user.model";
import logger from "../utils/logger";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";

class PurchaseService {
  // Get available networks for users
  async getNetworks() {
    try {
      const airtimeRecords = await AirtimeModel.find({ isActive: true }).sort({
        networkName: 1,
      });

      const networks = airtimeRecords.map((record) => ({
        id: record._id.toString(),
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
        planId: plan.planId, // Use actual OtoBill planId instead of customId
        name: plan.name,
        networkName: plan.networkName,
        planType: plan.planType,
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
        planId: plan.planId, // Use actual OtoBill planId instead of customId
        name: plan.name,
        networkName: plan.networkName,
        planType: plan.planType,
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

      // Create transaction record (profit will be calculated after OtoBill response)
      const transaction = new TransactionModel({
        userId,
        type: "airtime",
        amount: totalCost,
        currency: "NGN",
        status: "pending",
        reference: `AIR_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        description: `${data.networkName} airtime purchase for ${data.phoneNumber}`,
        networkName: data.networkName,
        phoneNumber: data.phoneNumber,
        profit: 0, // Will be calculated after OtoBill response
      });

      await transaction.save();

      try {
        // Call OtoBill API
        const otobillResponse = await otobillAPI.buyAirtime({
          networkName: data.networkName,
          phoneNumber: data.phoneNumber,
          amount: data.amount,
        });

        // Calculate profit: User paid totalCost, OtoBill charged otobillResponse.amount
        // Profit = totalCost - otobillResponse.amount
        const actualOtoBillCost = otobillResponse.amount;
        const profit = totalCost - actualOtoBillCost;

        // Update transaction with OtoBill response
        transaction.status = "completed";
        transaction.otobillRef = otobillResponse.topupmateRef;
        transaction.profit = Math.max(0, profit); // Ensure profit is not negative
        if (!transaction.metadata) {
          transaction.metadata = {};
        }
        transaction.metadata.otobillTransactionId =
          otobillResponse.transactionId;
        transaction.metadata.otobillStatus = "successful";
        transaction.metadata.otobillResponse = otobillResponse;
        transaction.metadata.actualOtoBillCost = actualOtoBillCost;
        transaction.metadata.calculatedProfit = profit;

        await transaction.save();

        return {
          transactionId: transaction._id,
          reference: transaction.reference,
          amount: data.amount,
          markup: airtime.adminPrice,
          totalCost,
          actualOtoBillCost,
          profit: transaction.profit,
          status: "completed",
          description: transaction.description,
          networkName: data.networkName,
          phoneNumber: data.phoneNumber,
          otobillRef: otobillResponse.topupmateRef,
        };
      } catch (otobillError) {
        // If OtoBill fails, refund user and update transaction
        user.wallet += totalCost;
        await user.save();

        transaction.status = "failed";
        if (!transaction.metadata) {
          transaction.metadata = {};
        }
        transaction.metadata.otobillStatus = "failed";
        transaction.metadata.otobillResponse = otobillError;

        await transaction.save();

        logger.error("OtoBill airtime purchase failed:", otobillError);
        throw new APIError(
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

      // Get data plan
      const dataPlan = await DataPlanModel.findOne({
        planId: data.planId, // Use actual OtoBill planId instead of customId
        isActive: true,
      });

      if (!dataPlan) {
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

      // Create transaction record
      const transaction = new TransactionModel({
        userId,
        type: "data",
        amount: dataPlan.adminPrice,
        currency: "NGN",
        status: "pending",
        reference: `DATA_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        description: `${dataPlan.name} for ${data.phoneNumber}`,
        networkName: dataPlan.networkName,
        phoneNumber: data.phoneNumber,
        planId: dataPlan.planId, // Use actual OtoBill planId
        planName: dataPlan.name,
        profit: dataPlan.adminPrice - (dataPlan.originalPrice || 0), // Handle undefined case
      });

      await transaction.save();

      try {
        // Call OtoBill API
        const otobillResponse = await otobillAPI.buyData({
          planId: dataPlan.planId, // Use OtoBill's plan ID
          phoneNumber: data.phoneNumber,
        });

        // Update transaction with OtoBill response
        transaction.status = "completed";
        transaction.otobillRef = otobillResponse.topupmateRef;
        if (!transaction.metadata) {
          transaction.metadata = {};
        }
        transaction.metadata.otobillTransactionId =
          otobillResponse.transactionId;
        transaction.metadata.otobillStatus = "successful";
        transaction.metadata.otobillResponse = otobillResponse;

        await transaction.save();

        return {
          transactionId: transaction._id,
          reference: transaction.reference,
          amount: dataPlan.adminPrice,
          profit: dataPlan.adminPrice - (dataPlan.originalPrice || 0), // Handle undefined case
          status: "completed",
          description: transaction.description,
          networkName: dataPlan.networkName,
          phoneNumber: data.phoneNumber,
          planId: dataPlan.planId, // Use actual OtoBill planId
          planName: dataPlan.name,
          otobillRef: otobillResponse.topupmateRef,
        };
      } catch (otobillError) {
        // If OtoBill fails, refund user and update transaction
        user.wallet += dataPlan.adminPrice;
        await user.save();

        transaction.status = "failed";
        if (!transaction.metadata) {
          transaction.metadata = {};
        }
        transaction.metadata.otobillStatus = "failed";
        transaction.metadata.otobillResponse = otobillError;

        await transaction.save();

        logger.error("OtoBill data purchase failed:", otobillError);
        throw new APIError(
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
      const query: any = { userId, type: { $in: ["airtime", "data"] } };

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

      // If transaction is pending, check with OtoBill
      if (transaction.status === "pending" && transaction.otobillRef) {
        try {
          const otobillStatus = await otobillAPI.checkTransactionStatus(
            transaction.otobillRef
          );

          // Update transaction status based on OtoBill response
          if (
            otobillStatus.status === "successful" &&
            transaction.status === "pending"
          ) {
            transaction.status = "completed";
            if (!transaction.metadata) {
              transaction.metadata = {};
            }
            transaction.metadata.otobillStatus = otobillStatus.status;
            transaction.metadata.otobillResponse = otobillStatus;
            await transaction.save();
          } else if (
            otobillStatus.status === "failed" &&
            transaction.status === "pending"
          ) {
            transaction.status = "failed";
            if (!transaction.metadata) {
              transaction.metadata = {};
            }
            transaction.metadata.otobillStatus = otobillStatus.status;
            transaction.metadata.otobillResponse = otobillStatus;
            await transaction.save();
          }
        } catch (otobillError) {
          logger.error(
            "Failed to check OtoBill transaction status:",
            otobillError
          );
        }
      }

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
        otobillRef: transaction.otobillRef,
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

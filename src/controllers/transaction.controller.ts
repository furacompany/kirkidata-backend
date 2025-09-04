import { Request, Response, NextFunction } from "express";
import TransactionModel from "../models/transaction.model";
import UserModel from "../models/user.model";
import { validateSchema } from "../validations/transaction.validation";
import {
  transactionSearchSchema,
  transactionStatsSchema,
} from "../validations/transaction.validation";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import logger from "../utils/logger";

// Interface for populated transaction
interface PopulatedTransaction {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  virtualAccountId?: {
    _id: string;
    accountNumber: string;
    bankName: string;
    accountName: string;
  };
  type: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  wiaxyRef?: string;
  merchantReference?: string;
  otobillRef?: string;
  description?: string;
  networkName?: string;
  phoneNumber?: string;
  planId?: string;
  planName?: string;
  profit?: number;
  metadata?: {
    payerAccountNumber?: string;
    payerFirstName?: string;
    payerLastName?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    otobillTransactionId?: string;
    otobillStatus?: string;
    otobillResponse?: any;
    actualOtoBillCost?: number;
    calculatedProfit?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

class TransactionController {
  // Get all transactions with filtering (admin only)
  async getAllTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const queryParams = req.query;

      // Convert string values to appropriate types
      const filters = {
        ...queryParams,
        page: queryParams.page
          ? parseInt(queryParams.page as string)
          : undefined,
        limit: queryParams.limit
          ? parseInt(queryParams.limit as string)
          : undefined,
        minAmount: queryParams.minAmount
          ? parseFloat(queryParams.minAmount as string)
          : undefined,
        maxAmount: queryParams.maxAmount
          ? parseFloat(queryParams.maxAmount as string)
          : undefined,
        startDate: queryParams.startDate
          ? new Date(queryParams.startDate as string)
          : undefined,
        endDate: queryParams.endDate
          ? new Date(queryParams.endDate as string)
          : undefined,
      };

      // Validate filters
      const validatedFilters = validateSchema(transactionSearchSchema, filters);

      // Build MongoDB query
      const query: any = {};

      // Date filtering
      if (validatedFilters.startDate || validatedFilters.endDate) {
        query.createdAt = {};
        if (validatedFilters.startDate) {
          query.createdAt.$gte = validatedFilters.startDate;
        }
        if (validatedFilters.endDate) {
          query.createdAt.$lte = validatedFilters.endDate;
        }
      }

      // Type filtering
      if (validatedFilters.type) {
        query.type = validatedFilters.type;
      }

      // Status filtering
      if (validatedFilters.status) {
        query.status = validatedFilters.status;
      }

      // Amount filtering
      if (validatedFilters.minAmount || validatedFilters.maxAmount) {
        query.amount = {};
        if (validatedFilters.minAmount) {
          query.amount.$gte = validatedFilters.minAmount;
        }
        if (validatedFilters.maxAmount) {
          query.amount.$lte = validatedFilters.maxAmount;
        }
      }

      // Network filtering (for airtime/data transactions)
      if (validatedFilters.networkName) {
        query.networkName = validatedFilters.networkName;
      }

      // Phone number filtering
      if (validatedFilters.phoneNumber) {
        query.phoneNumber = validatedFilters.phoneNumber;
      }

      // Pagination
      const page = validatedFilters.page || 1;
      const limit = validatedFilters.limit || 20;
      const skip = (page - 1) * limit;

      // Execute query with pagination
      const [transactions, total] = await Promise.all([
        TransactionModel.find(query)
          .populate("userId", "firstName lastName email phone")
          .populate("virtualAccountId", "accountNumber bankName accountName")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        TransactionModel.countDocuments(query),
      ]);

      // Type assertion for populated transactions
      const populatedTransactions =
        transactions as unknown as PopulatedTransaction[];

      const totalPages = Math.ceil(total / limit);

      // Format response data
      const formattedTransactions = populatedTransactions.map(
        (transaction) => ({
          id: transaction._id,
          type: transaction.type,
          status: transaction.status,
          amount: transaction.amount,
          currency: transaction.currency,
          reference: transaction.reference,
          description: transaction.description,
          profit: transaction.profit || 0,
          user: {
            id: transaction.userId._id,
            name: `${transaction.userId.firstName} ${transaction.userId.lastName}`,
            email: transaction.userId.email,
            phone: transaction.userId.phone,
          },
          virtualAccount: transaction.virtualAccountId
            ? {
                accountNumber: transaction.virtualAccountId.accountNumber,
                bankName: transaction.virtualAccountId.bankName,
              }
            : null,
          // Transaction-specific details
          ...(transaction.type === "airtime" && {
            airtime: {
              networkName: transaction.networkName,
              phoneNumber: transaction.phoneNumber,
            },
          }),
          ...(transaction.type === "data" && {
            data: {
              networkName: transaction.networkName,
              phoneNumber: transaction.phoneNumber,
              planId: transaction.planId,
              planName: transaction.planName,
            },
          }),
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
        })
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Transactions retrieved successfully",
        data: {
          transactions: formattedTransactions,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
          filters: {
            type: validatedFilters.type,
            status: validatedFilters.status,
            networkName: validatedFilters.networkName,
            startDate: validatedFilters.startDate,
            endDate: validatedFilters.endDate,
            minAmount: validatedFilters.minAmount,
            maxAmount: validatedFilters.maxAmount,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get transaction statistics (admin only)
  async getTransactionStats(req: Request, res: Response, next: NextFunction) {
    try {
      const queryParams = req.query;

      // Convert string values to appropriate types
      const filters = {
        ...queryParams,
        startDate: queryParams.startDate
          ? new Date(queryParams.startDate as string)
          : undefined,
        endDate: queryParams.endDate
          ? new Date(queryParams.endDate as string)
          : undefined,
      };

      // Validate filters
      const validatedFilters = validateSchema(transactionStatsSchema, filters);

      // Build date filter for MongoDB
      const dateFilter: any = {};
      if (validatedFilters.startDate || validatedFilters.endDate) {
        dateFilter.createdAt = {};
        if (validatedFilters.startDate) {
          dateFilter.createdAt.$gte = validatedFilters.startDate;
        }
        if (validatedFilters.endDate) {
          dateFilter.createdAt.$lte = validatedFilters.endDate;
        }
      }

      // Get total users (all users, not filtered by date)
      const totalUsers = await UserModel.countDocuments();

      // Get total transactions
      const totalTransactions = await TransactionModel.countDocuments(
        dateFilter
      );

      // Get total wallet funding (successful funding transactions)
      const totalWalletFunding = await TransactionModel.aggregate([
        {
          $match: {
            ...dateFilter,
            type: "funding",
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]);

      // Get airtime statistics (successful transactions only)
      const airtimeStats = await TransactionModel.aggregate([
        {
          $match: {
            ...dateFilter,
            type: "airtime",
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
            totalProfit: { $sum: "$profit" },
            averageProfit: { $avg: "$profit" },
          },
        },
      ]);

      // Get data statistics (successful transactions only)
      const dataStats = await TransactionModel.aggregate([
        {
          $match: {
            ...dateFilter,
            type: "data",
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
            totalProfit: { $sum: "$profit" },
            averageProfit: { $avg: "$profit" },
          },
        },
      ]);

      // Get transaction status breakdown
      const statusBreakdown = await TransactionModel.aggregate([
        {
          $match: dateFilter,
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      // Get transaction type breakdown
      const typeBreakdown = await TransactionModel.aggregate([
        {
          $match: dateFilter,
        },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
            totalProfit: { $sum: "$profit" },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      // Format the response
      const stats = {
        overview: {
          totalUsers,
          totalTransactions,
          totalWalletFunding: totalWalletFunding[0]?.total || 0,
          totalProfit:
            (airtimeStats[0]?.totalProfit || 0) +
            (dataStats[0]?.totalProfit || 0),
        },
        airtime: {
          totalTransactions: airtimeStats[0]?.totalTransactions || 0,
          totalAmount: airtimeStats[0]?.totalAmount || 0,
          totalProfit: airtimeStats[0]?.totalProfit || 0,
          averageProfit: airtimeStats[0]?.averageProfit || 0,
        },
        data: {
          totalTransactions: dataStats[0]?.totalTransactions || 0,
          totalAmount: dataStats[0]?.totalAmount || 0,
          totalProfit: dataStats[0]?.totalProfit || 0,
          averageProfit: dataStats[0]?.averageProfit || 0,
        },
        breakdown: {
          byStatus: statusBreakdown,
          byType: typeBreakdown,
        },
        period: {
          startDate: validatedFilters.startDate,
          endDate: validatedFilters.endDate,
          isOverall: !validatedFilters.startDate && !validatedFilters.endDate,
        },
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

  // Get transaction by ID (admin only)
  async getTransactionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactionId } = req.params;

      if (!transactionId) {
        throw new APIError(
          "Transaction ID is required",
          HttpStatus.BAD_REQUEST
        );
      }

      const transaction = await TransactionModel.findById(transactionId)
        .populate("userId", "firstName lastName email phone")
        .populate("virtualAccountId", "accountNumber bankName accountName")
        .lean();

      // Type assertion for populated transaction
      const populatedTransaction =
        transaction as unknown as PopulatedTransaction;

      if (!populatedTransaction) {
        throw new APIError("Transaction not found", HttpStatus.NOT_FOUND);
      }

      // Format response data
      const formattedTransaction = {
        id: populatedTransaction._id,
        type: populatedTransaction.type,
        status: populatedTransaction.status,
        amount: populatedTransaction.amount,
        currency: populatedTransaction.currency,
        reference: populatedTransaction.reference,
        wiaxyRef: populatedTransaction.wiaxyRef,
        merchantReference: populatedTransaction.merchantReference,
        otobillRef: populatedTransaction.otobillRef,
        description: populatedTransaction.description,
        profit: populatedTransaction.profit || 0,
        user: {
          id: populatedTransaction.userId._id,
          name: `${populatedTransaction.userId.firstName} ${populatedTransaction.userId.lastName}`,
          email: populatedTransaction.userId.email,
          phone: populatedTransaction.userId.phone,
        },
        virtualAccount: populatedTransaction.virtualAccountId
          ? {
              accountNumber:
                populatedTransaction.virtualAccountId.accountNumber,
              bankName: populatedTransaction.virtualAccountId.bankName,
              accountName: populatedTransaction.virtualAccountId.accountName,
            }
          : null,
        // Transaction-specific details
        ...(populatedTransaction.type === "airtime" && {
          airtime: {
            networkName: populatedTransaction.networkName,
            phoneNumber: populatedTransaction.phoneNumber,
          },
        }),
        ...(populatedTransaction.type === "data" && {
          data: {
            networkName: populatedTransaction.networkName,
            phoneNumber: populatedTransaction.phoneNumber,
            planId: populatedTransaction.planId,
            planName: populatedTransaction.planName,
          },
        }),
        metadata: populatedTransaction.metadata,
        createdAt: populatedTransaction.createdAt,
        updatedAt: populatedTransaction.updatedAt,
      };

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Transaction retrieved successfully",
        data: formattedTransaction,
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
        message: "Transaction service is healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TransactionController();

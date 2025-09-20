import TransactionModel from "../models/transaction.model";
import UserModel from "../models/user.model";
import VirtualAccountModel from "../models/virtualAccount.model";
import logger from "../utils/logger";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";

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

export interface AdminUserTransactionsFilters {
  type?: "funding" | "airtime" | "data";
  status?: "pending" | "completed" | "failed" | "cancelled";
  networkName?: "MTN" | "AIRTEL" | "GLO" | "9MOBILE";
  phoneNumber?: string;
  minAmount?: number;
  maxAmount?: number;
  minProfit?: number;
  maxProfit?: number;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "amount" | "type" | "status" | "profit" | "updatedAt";
  sortOrder?: "asc" | "desc";
  includeMetadata?: boolean;
}

export interface AdminUserTransactionsResult {
  transactions: any[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    isActive: boolean;
    isEmailVerified: boolean;
    wallet: number;
    state: string | undefined;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary: {
    totalTransactions: number;
    totalAmount: number;
    totalProfit: number;
    byType: {
      funding: { count: number; amount: number };
      airtime: { count: number; amount: number; profit: number };
      data: { count: number; amount: number; profit: number };
    };
    byStatus: {
      pending: { count: number; amount: number };
      completed: { count: number; amount: number; profit: number };
      failed: { count: number; amount: number };
      cancelled: { count: number; amount: number };
    };
  };
  filters: AdminUserTransactionsFilters;
}

class TransactionService {
  // Get all user transactions with admin filters
  async getAdminUserTransactions(
    userId: string,
    filters: AdminUserTransactionsFilters
  ): Promise<AdminUserTransactionsResult> {
    try {
      // First, verify user exists and get user details
      const user = await UserModel.findById(userId).select("-password -pin");

      if (!user) {
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }

      // Build MongoDB query
      const query: any = { userId };

      // Date filtering
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = filters.startDate;
        }
        if (filters.endDate) {
          query.createdAt.$lte = filters.endDate;
        }
      }

      // Type filtering
      if (filters.type) {
        query.type = filters.type;
      }

      // Status filtering
      if (filters.status) {
        query.status = filters.status;
      }

      // Amount filtering
      if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        query.amount = {};
        if (filters.minAmount !== undefined) {
          query.amount.$gte = filters.minAmount;
        }
        if (filters.maxAmount !== undefined) {
          query.amount.$lte = filters.maxAmount;
        }
      }

      // Profit filtering
      if (filters.minProfit !== undefined || filters.maxProfit !== undefined) {
        query.profit = {};
        if (filters.minProfit !== undefined) {
          query.profit.$gte = filters.minProfit;
        }
        if (filters.maxProfit !== undefined) {
          query.profit.$lte = filters.maxProfit;
        }
      }

      // Network filtering (for airtime/data transactions)
      if (filters.networkName) {
        query.networkName = filters.networkName;
      }

      // Phone number filtering
      if (filters.phoneNumber) {
        query.phoneNumber = filters.phoneNumber;
      }

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      // Build sort object
      const sort: any = {};
      const sortBy = filters.sortBy || "createdAt";
      const sortOrder = filters.sortOrder || "desc";
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Execute query with pagination
      const [transactions, total] = await Promise.all([
        TransactionModel.find(query)
          .populate("virtualAccountId", "accountNumber bankName accountName")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        TransactionModel.countDocuments(query),
      ]);

      // Type assertion for populated transactions
      const populatedTransactions =
        transactions as unknown as PopulatedTransaction[];

      const totalPages = Math.ceil(total / limit);

      // Calculate summary statistics
      const summaryQuery: any = { userId };
      if (filters.startDate || filters.endDate) {
        summaryQuery.createdAt = {};
        if (filters.startDate) {
          summaryQuery.createdAt.$gte = filters.startDate;
        }
        if (filters.endDate) {
          summaryQuery.createdAt.$lte = filters.endDate;
        }
      }

      const [
        totalAmountResult,
        totalProfitResult,
        typeBreakdown,
        statusBreakdown,
      ] = await Promise.all([
        TransactionModel.aggregate([
          { $match: summaryQuery },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        TransactionModel.aggregate([
          { $match: summaryQuery },
          { $group: { _id: null, total: { $sum: "$profit" } } },
        ]),
        TransactionModel.aggregate([
          { $match: summaryQuery },
          {
            $group: {
              _id: "$type",
              count: { $sum: 1 },
              amount: { $sum: "$amount" },
              profit: { $sum: "$profit" },
            },
          },
        ]),
        TransactionModel.aggregate([
          { $match: summaryQuery },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              amount: { $sum: "$amount" },
              profit: { $sum: "$profit" },
            },
          },
        ]),
      ]);

      // Format type breakdown
      const byType = {
        funding: { count: 0, amount: 0 },
        airtime: { count: 0, amount: 0, profit: 0 },
        data: { count: 0, amount: 0, profit: 0 },
      };

      typeBreakdown.forEach((item) => {
        if (item._id === "funding") {
          byType.funding = { count: item.count, amount: item.amount };
        } else if (item._id === "airtime") {
          byType.airtime = {
            count: item.count,
            amount: item.amount,
            profit: item.profit,
          };
        } else if (item._id === "data") {
          byType.data = {
            count: item.count,
            amount: item.amount,
            profit: item.profit,
          };
        }
      });

      // Format status breakdown
      const byStatus = {
        pending: { count: 0, amount: 0 },
        completed: { count: 0, amount: 0, profit: 0 },
        failed: { count: 0, amount: 0 },
        cancelled: { count: 0, amount: 0 },
      };

      statusBreakdown.forEach((item) => {
        if (item._id === "pending") {
          byStatus.pending = { count: item.count, amount: item.amount };
        } else if (item._id === "completed") {
          byStatus.completed = {
            count: item.count,
            amount: item.amount,
            profit: item.profit,
          };
        } else if (item._id === "failed") {
          byStatus.failed = { count: item.count, amount: item.amount };
        } else if (item._id === "cancelled") {
          byStatus.cancelled = { count: item.count, amount: item.amount };
        }
      });

      // Format response data
      const formattedTransactions = populatedTransactions.map((transaction) => {
        const baseTransaction = {
          id: transaction._id,
          type: transaction.type,
          status: transaction.status,
          amount: transaction.amount,
          currency: transaction.currency,
          reference: transaction.reference,
          description: transaction.description,
          profit: transaction.profit || 0,
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
          ...(transaction.type === "funding" && {
            funding: {
              payerAccountNumber: transaction.metadata?.payerAccountNumber,
              payerName: transaction.metadata
                ? `${transaction.metadata.payerFirstName || ""} ${
                    transaction.metadata.payerLastName || ""
                  }`.trim()
                : null,
              bankName: transaction.metadata?.bankName,
            },
          }),
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
        };

        // Include metadata if requested
        if (filters.includeMetadata) {
          return {
            ...baseTransaction,
            metadata: transaction.metadata,
            wiaxyRef: transaction.wiaxyRef,
            merchantReference: transaction.merchantReference,
            otobillRef: transaction.otobillRef,
          };
        }

        return baseTransaction;
      });

      return {
        transactions: formattedTransactions,
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          wallet: user.wallet,
          state: user.state,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        summary: {
          totalTransactions: total,
          totalAmount: totalAmountResult[0]?.total || 0,
          totalProfit: totalProfitResult[0]?.total || 0,
          byType,
          byStatus,
        },
        filters,
      };
    } catch (error) {
      logger.error("Failed to get admin user transactions:", error);
      throw error;
    }
  }

  // Get transaction by ID (admin only)
  async getTransactionById(transactionId: string) {
    try {
      const transaction = await TransactionModel.findById(transactionId)
        .populate("userId", "firstName lastName email phone")
        .populate("virtualAccountId", "accountNumber bankName accountName")
        .lean();

      if (!transaction) {
        throw new APIError("Transaction not found", HttpStatus.NOT_FOUND);
      }

      return transaction;
    } catch (error) {
      logger.error("Failed to get transaction by ID:", error);
      throw error;
    }
  }
}

export default new TransactionService();

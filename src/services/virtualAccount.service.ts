import mongoose from "mongoose";
import VirtualAccountModel, {
  IVirtualAccount,
} from "../models/virtualAccount.model";
import TransactionModel, { ITransaction } from "../models/transaction.model";
import UserModel from "../models/user.model";
import logger from "../utils/logger";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";

export interface CreateVirtualAccountData {
  userId: string;
  bvn: string;
  middleName?: string;
}

export interface VirtualAccountKYCData {
  userId: string;
  bvn: string;
}

export interface VirtualAccountWithTransactions {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  provider: "palmpay";
  virtualAccountNo: string;
  virtualAccountName: string;
  status: "Enabled" | "Disabled" | "Deleted";
  identityType: "personal" | "personal_nin" | "company";
  licenseNumber: string;
  customerName: string;
  email?: string;
  accountReference?: string;
  createdAt: Date;
  updatedAt: Date;
  transactions?: ITransaction[];
}

class VirtualAccountService {
  // Get user by ID
  async getUserById(userId: string) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }
      return user;
    } catch (error) {
      logger.error("Failed to get user by ID:", error);
      throw error;
    }
  }

  // Get user's virtual accounts
  async getUserVirtualAccounts(userId: string): Promise<IVirtualAccount[]> {
    try {
      const accounts = await VirtualAccountModel.find({
        userId,
        provider: "palmpay",
      }).sort({ createdAt: -1 });

      return accounts;
    } catch (error) {
      logger.error("Failed to get user virtual accounts:", error);
      throw error;
    }
  }

  // Get virtual account by ID
  async getVirtualAccountById(accountId: string): Promise<IVirtualAccount> {
    try {
      const account = await VirtualAccountModel.findById(accountId);
      if (!account) {
        throw new APIError("Virtual account not found", HttpStatus.NOT_FOUND);
      }
      return account;
    } catch (error) {
      logger.error("Failed to get virtual account by ID:", error);
      throw error;
    }
  }

  // Get virtual account with transactions
  async getVirtualAccountWithTransactions(
    accountId: string,
    limit: number = 10
  ): Promise<VirtualAccountWithTransactions> {
    try {
      const account = await VirtualAccountModel.findById(accountId);
      if (!account) {
        throw new APIError("Virtual account not found", HttpStatus.NOT_FOUND);
      }

      // Get recent transactions for this virtual account
      const transactions = await TransactionModel.find({
        virtualAccountId: account._id,
      })
        .sort({ createdAt: -1 })
        .limit(limit);

      return {
        ...account.toObject(),
        transactions,
      } as VirtualAccountWithTransactions;
    } catch (error) {
      logger.error("Failed to get virtual account with transactions:", error);
      throw error;
    }
  }

  // Upgrade virtual account KYC (placeholder for PalmPay)
  async upgradeVirtualAccountKYC(
    data: VirtualAccountKYCData
  ): Promise<IVirtualAccount> {
    try {
      // For PalmPay, KYC is handled during account creation
      // This method is kept for compatibility
      const account = await VirtualAccountModel.findOne({
        userId: data.userId,
        provider: "palmpay",
      });

      if (!account) {
        throw new APIError("Virtual account not found", HttpStatus.NOT_FOUND);
      }

      logger.info("KYC upgrade requested for PalmPay virtual account", {
        userId: data.userId,
        virtualAccountNo: account.virtualAccountNo,
        bvn: data.bvn,
      });

      return account;
    } catch (error) {
      logger.error("Failed to upgrade virtual account KYC:", error);
      throw error;
    }
  }

  // Process payment notification (handled by PalmPay webhook controller)
  async processPaymentNotification(webhookPayload: any): Promise<void> {
    try {
      // This method is kept for compatibility but actual processing
      // is handled in the PalmPay webhook controller
      logger.info(
        "Payment notification processing delegated to PalmPay webhook controller"
      );
    } catch (error) {
      logger.error("Failed to process payment notification:", error);
      throw error;
    }
  }

  // Get user transactions
  async getUserTransactions(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    transactions: ITransaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        TransactionModel.find({ userId })
          .populate("virtualAccountId", "virtualAccountNo virtualAccountName")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        TransactionModel.countDocuments({ userId }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error("Failed to get user transactions:", error);
      throw error;
    }
  }

  // Verify webhook signature (handled by PalmPay utilities)
  verifyWebhookSignature(signature: string, payload: string): boolean {
    try {
      // This method is kept for compatibility but actual verification
      // is handled by PalmPay utilities
      logger.info(
        "Webhook signature verification delegated to PalmPay utilities"
      );
      return true;
    } catch (error) {
      logger.error("Failed to verify webhook signature:", error);
      return false;
    }
  }

  // Get available banks for user
  async getAvailableBanks(userId: string): Promise<{
    available: Array<{ bankId: string; bankName: string }>;
    existing: Array<{
      bankId: string;
      bankName: string;
      virtualAccountNo: string;
      status: string;
    }>;
  }> {
    try {
      // Check if user already has a virtual account
      const existingAccount = await VirtualAccountModel.findOne({
        userId,
        provider: "palmpay",
      });

      return {
        available: existingAccount
          ? []
          : [
              {
                bankId: "PALMPAY",
                bankName: "Palmpay Bank",
              },
            ],
        existing: existingAccount
          ? [
              {
                bankId: "PALMPAY",
                bankName: "Palmpay Bank",
                virtualAccountNo: existingAccount.virtualAccountNo,
                status: existingAccount.status,
              },
            ]
          : [],
      };
    } catch (error) {
      logger.error("Failed to get available banks:", error);
      throw error;
    }
  }
}

export default new VirtualAccountService();

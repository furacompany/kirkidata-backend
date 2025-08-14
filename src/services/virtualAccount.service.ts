import mongoose from "mongoose";
import VirtualAccountModel, {
  IVirtualAccount,
} from "../models/virtualAccount.model";
import TransactionModel, { ITransaction } from "../models/transaction.model";
import UserModel from "../models/user.model";
import billstackAPI from "../configs/billstack";
import logger from "../utils/logger";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import { BankType, BANK_NAMES } from "../constants/banks.constant";

export interface CreateVirtualAccountData {
  userId: string;
  bank: BankType;
}

export interface VirtualAccountKYCData {
  userId: string;
  bvn: string;
}

export interface VirtualAccountWithTransactions {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reference: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankId: BankType;
  isActive: boolean;
  isKYCVerified: boolean;
  bvn?: string;
  createdAt: Date;
  updatedAt: Date;
  transactions?: ITransaction[];
}

class VirtualAccountService {
  // Create virtual account for user
  async createVirtualAccount(
    data: CreateVirtualAccountData
  ): Promise<IVirtualAccount> {
    try {
      // Check if BillStack is configured
      if (!billstackAPI.isConfigured()) {
        throw new APIError(
          "BillStack API is not configured",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Get user details
      const user = await UserModel.findById(data.userId);
      if (!user) {
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }

      // Check if user already has an account for this bank
      const existingAccount = await VirtualAccountModel.findOne({
        userId: data.userId,
        bankId: data.bank,
        isActive: true,
      });

      if (existingAccount) {
        throw new APIError(
          `User already has an active ${data.bank} virtual account. Each user can only have one account per bank.`,
          HttpStatus.CONFLICT
        );
      }

      // Generate unique reference with more randomness
      const timestamp = Date.now();
      const randomPart = Math.random().toString(36).substr(2, 12);
      const reference = `VA_${user._id}_${timestamp}_${randomPart}`;

      // Create virtual account via BillStack API
      const billstackRequest = {
        email: user.email,
        reference,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        bank: data.bank,
      };

      const billstackResponse = await billstackAPI.createVirtualAccount(
        billstackRequest
      );

      if (!billstackResponse.status || !billstackResponse.data.account?.[0]) {
        throw new APIError(
          "Failed to create virtual account with BillStack",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const accountData = billstackResponse.data.account[0];

      // Check if the BillStack reference already exists in our database
      const existingReference = await VirtualAccountModel.findOne({
        reference: billstackResponse.data.reference,
      });

      if (existingReference) {
        logger.warn(
          `BillStack reference ${billstackResponse.data.reference} already exists in database`
        );
        throw new APIError(
          "Virtual account creation failed due to duplicate reference. Please try again.",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Save virtual account to database with retry mechanism for duplicate references
      let virtualAccount;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          virtualAccount = new VirtualAccountModel({
            userId: data.userId,
            reference: billstackResponse.data.reference,
            accountNumber: accountData.account_number,
            accountName: accountData.account_name,
            bankName: accountData.bank_name,
            bankId: accountData.bank_id,
            isActive: true,
            isKYCVerified: false,
          });

          await virtualAccount.save();
          break; // Success, exit the retry loop
        } catch (error: any) {
          // Check if it's a duplicate key error
          if (error.code === 11000 && error.keyPattern?.reference) {
            retryCount++;
            if (retryCount >= maxRetries) {
              logger.error(
                `Failed to save virtual account after ${maxRetries} retries due to duplicate reference`
              );
              throw new APIError(
                "Failed to create virtual account due to duplicate reference. Please try again.",
                HttpStatus.INTERNAL_SERVER_ERROR
              );
            }

            // Generate a new reference and retry
            const newTimestamp = Date.now();
            const newRandomPart = Math.random().toString(36).substr(2, 12);
            const newReference = `VA_${user._id}_${newTimestamp}_${newRandomPart}`;

            // Update the BillStack request with new reference
            const newBillstackRequest = {
              ...billstackRequest,
              reference: newReference,
            };

            // Call BillStack API again with new reference
            const newBillstackResponse =
              await billstackAPI.createVirtualAccount(newBillstackRequest);

            if (
              !newBillstackResponse.status ||
              !newBillstackResponse.data.account?.[0]
            ) {
              throw new APIError(
                "Failed to create virtual account with BillStack on retry",
                HttpStatus.INTERNAL_SERVER_ERROR
              );
            }

            // Update the response data
            const newAccountData = newBillstackResponse.data.account[0];
            accountData.account_number = newAccountData.account_number;
            accountData.account_name = newAccountData.account_name;
            accountData.bank_name = newAccountData.bank_name;
            accountData.bank_id = newAccountData.bank_id;
            billstackResponse.data.reference =
              newBillstackResponse.data.reference;

            logger.info(
              `Retrying virtual account creation with new reference: ${newReference}`
            );
            continue; // Retry with new data
          } else {
            // It's not a duplicate key error, re-throw
            throw error;
          }
        }
      }

      // Ensure virtualAccount is defined
      if (!virtualAccount) {
        throw new APIError(
          "Failed to create virtual account after retries",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      logger.info(
        `Virtual account created for user ${data.userId}: ${accountData.account_number}`
      );

      return virtualAccount;
    } catch (error) {
      logger.error(
        `Failed to create virtual account for user ${data.userId}:`,
        error
      );
      throw error;
    }
  }

  // Get user's virtual accounts
  async getUserVirtualAccounts(userId: string): Promise<IVirtualAccount[]> {
    try {
      const accounts = await VirtualAccountModel.find({
        userId,
        isActive: true,
      }).sort({ createdAt: -1 });

      return accounts;
    } catch (error) {
      logger.error(`Failed to get virtual accounts for user ${userId}:`, error);
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
      logger.error(`Failed to get virtual account ${accountId}:`, error);
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

      const transactions = await TransactionModel.find({
        virtualAccountId: accountId,
      })
        .sort({ createdAt: -1 })
        .limit(limit);

      const accountData = account.toObject();
      return {
        ...accountData,
        transactions,
      };
    } catch (error) {
      logger.error(
        `Failed to get virtual account with transactions ${accountId}:`,
        error
      );
      throw error;
    }
  }

  // Upgrade virtual account with KYC
  async upgradeVirtualAccountKYC(
    data: VirtualAccountKYCData
  ): Promise<IVirtualAccount> {
    try {
      // Check if BillStack is configured
      if (!billstackAPI.isConfigured()) {
        throw new APIError(
          "BillStack API is not configured",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Get user details
      const user = await UserModel.findById(data.userId);
      if (!user) {
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }

      // Get user's virtual accounts
      const virtualAccounts = await VirtualAccountModel.find({
        userId: data.userId,
        isActive: true,
      });

      if (virtualAccounts.length === 0) {
        throw new APIError(
          "User has no virtual accounts to upgrade",
          HttpStatus.BAD_REQUEST
        );
      }

      // Upgrade KYC via BillStack API
      const billstackRequest = {
        customer: user.email,
        bvn: data.bvn,
      };

      const billstackResponse = await billstackAPI.upgradeVirtualAccountKYC(
        billstackRequest
      );

      if (!billstackResponse.status) {
        throw new APIError(
          billstackResponse.message || "Failed to upgrade virtual account KYC",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Update all user's virtual accounts with KYC status
      await VirtualAccountModel.updateMany(
        { userId: data.userId, isActive: true },
        {
          isKYCVerified: true,
          bvn: data.bvn,
        }
      );

      // Get updated accounts
      const updatedAccounts = await VirtualAccountModel.find({
        userId: data.userId,
        isActive: true,
      });

      if (!updatedAccounts.length) {
        throw new APIError(
          "No virtual accounts found after KYC upgrade",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      logger.info(`Virtual account KYC upgraded for user ${data.userId}`);

      return updatedAccounts[0]!; // Return first account as representative
    } catch (error) {
      logger.error(
        `Failed to upgrade virtual account KYC for user ${data.userId}:`,
        error
      );
      throw error;
    }
  }

  // Process webhook payment notification
  async processPaymentNotification(webhookPayload: any): Promise<void> {
    try {
      logger.info("Processing webhook payment notification:", {
        payloadKeys: Object.keys(webhookPayload),
        event: webhookPayload.event,
        hasData: !!webhookPayload.data,
        dataKeys: webhookPayload.data ? Object.keys(webhookPayload.data) : [],
      });

      // Parse and validate webhook payload
      const payload = billstackAPI.parseWebhookPayload(webhookPayload);

      if (!billstackAPI.validateWebhookPayload(payload)) {
        logger.error("Webhook payload validation failed:", webhookPayload);
        throw new APIError("Invalid webhook payload", HttpStatus.BAD_REQUEST);
      }

      const { data } = payload;
      logger.info("Webhook data extracted:", {
        reference: data.reference,
        amount: data.amount,
        accountNumber: data.account?.account_number,
        merchantReference: data.merchant_reference,
        wiaxyRef: data.wiaxy_ref,
        transactionRef: data.transaction_ref,
        payerAccountNumber: data.payer?.account_number,
        payerAccountName: data.payer?.account_name,
        customerEmail: data.customer?.email,
        customerName: `${data.customer?.firstName} ${data.customer?.lastName}`,
      });

      // Check if transaction already exists
      const existingTransaction = await TransactionModel.findOne({
        reference: data.reference,
      });

      if (existingTransaction) {
        logger.info(
          `Transaction ${data.reference} already processed, skipping`
        );
        return;
      }

      logger.info(`Processing new transaction: ${data.reference}`);

      // Find virtual account by account number
      const virtualAccount = await VirtualAccountModel.findOne({
        accountNumber: data.account.account_number,
        isActive: true,
      });

      if (!virtualAccount) {
        logger.error(
          `Virtual account not found for account number: ${data.account.account_number}`
        );
        throw new APIError("Virtual account not found", HttpStatus.NOT_FOUND);
      }

      logger.info(`Found virtual account for user: ${virtualAccount.userId}`);

      // Get user before updating wallet
      const userBeforeUpdate = await UserModel.findById(virtualAccount.userId);
      if (!userBeforeUpdate) {
        logger.error(`User not found: ${virtualAccount.userId}`);
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }

      logger.info(
        `User wallet balance before update: ${userBeforeUpdate.wallet} NGN`
      );

      // Create transaction record
      const transaction = new TransactionModel({
        userId: virtualAccount.userId,
        virtualAccountId: virtualAccount._id,
        type: "funding",
        amount: parseFloat(data.amount),
        currency: "NGN",
        status: "completed",
        reference: data.reference,
        wiaxyRef: data.wiaxy_ref,
        merchantReference: data.merchant_reference,
        description: `Payment received via ${data.account.bank_name}`,
        metadata: {
          payerAccountNumber: data.payer.account_number,
          payerAccountName: data.payer.account_name,
          payerBankName: data.payer.bank_name,
          payerBankId: data.payer.bank_id,
          bankName: data.account.bank_name,
          bankId: data.account.bank_id,
          accountNumber: data.account.account_number,
          accountName: data.account.account_name,
          customerEmail: data.customer?.email,
          customerFirstName: data.customer?.firstName,
          customerLastName: data.customer?.lastName,
          transactionRef: data.transaction_ref,
        },
      });

      await transaction.save();
      logger.info(`Transaction saved: ${data.reference}`);

      // Update user's wallet balance
      const amount = parseFloat(data.amount);
      logger.info(
        `Updating wallet balance for user ${virtualAccount.userId} by ${amount} NGN`
      );

      const updatedUser = await UserModel.findByIdAndUpdate(
        virtualAccount.userId,
        {
          $inc: { wallet: amount },
        },
        { new: true }
      );

      if (!updatedUser) {
        logger.error(
          `Failed to update wallet balance for user: ${virtualAccount.userId}`
        );
        throw new APIError(
          "Failed to update wallet balance",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      logger.info(
        `Payment processed successfully: ${data.reference} - Amount: ${data.amount} NGN - Old balance: ${userBeforeUpdate.wallet} NGN - New balance: ${updatedUser.wallet} NGN`
      );
    } catch (error) {
      logger.error("Failed to process payment notification:", error);
      throw error;
    }
  }

  // Get transaction history for user
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
          .populate("virtualAccountId", "accountNumber bankName")
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
      logger.error(`Failed to get transactions for user ${userId}:`, error);
      throw error;
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(signature: string, payload: string): boolean {
    return billstackAPI.verifyWebhookSignature(signature, payload);
  }

  // Get available banks for user
  async getAvailableBanks(userId: string): Promise<{
    available: Array<{ bankId: string; bankName: string }>;
    existing: Array<{
      bankId: string;
      bankName: string;
      accountNumber: string;
    }>;
  }> {
    try {
      const userAccounts = await VirtualAccountModel.find({
        userId,
        isActive: true,
      }).select("bankId bankName accountNumber");

      const allBanks = [
        { bankId: BankType.NINE_PSB, bankName: BANK_NAMES[BankType.NINE_PSB] },
        { bankId: BankType.PALMPAY, bankName: BANK_NAMES[BankType.PALMPAY] },
      ];

      const existingBankIds = userAccounts.map((account) => account.bankId);
      const availableBanks = allBanks.filter(
        (bank) => !existingBankIds.includes(bank.bankId)
      );

      return {
        available: availableBanks,
        existing: userAccounts.map((account) => ({
          bankId: account.bankId,
          bankName: account.bankName,
          accountNumber: account.accountNumber,
        })),
      };
    } catch (error) {
      logger.error(`Failed to get available banks for user ${userId}:`, error);
      throw error;
    }
  }
}

export default new VirtualAccountService();

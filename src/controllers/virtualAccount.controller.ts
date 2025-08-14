import { Request, Response, NextFunction } from "express";
import virtualAccountService from "../services/virtualAccount.service";
import { validateSchema } from "../validations/virtualAccount.validation";
import {
  createVirtualAccountSchema,
  upgradeKYCSchema,
  getTransactionsSchema,
} from "../validations/virtualAccount.validation";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import logger from "../utils/logger";
import billstackAPI from "../configs/billstack";

class VirtualAccountController {
  // Create virtual account
  async createVirtualAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError("Unauthorized", HttpStatus.UNAUTHORIZED);
      }

      // Validate request body
      const validatedData = validateSchema(
        createVirtualAccountSchema,
        req.body
      );

      // Create virtual account
      const virtualAccount = await virtualAccountService.createVirtualAccount({
        userId,
        bank: validatedData.bank,
      });

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Virtual account created successfully",
        data: virtualAccount,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user's virtual accounts
  async getUserVirtualAccounts(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError("Unauthorized", HttpStatus.UNAUTHORIZED);
      }

      const accounts = await virtualAccountService.getUserVirtualAccounts(
        userId
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Virtual accounts retrieved successfully",
        data: accounts,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get virtual account by ID
  async getVirtualAccountById(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new APIError("Unauthorized", HttpStatus.UNAUTHORIZED);
      }

      if (!accountId) {
        throw new APIError("Account ID is required", HttpStatus.BAD_REQUEST);
      }

      const account = await virtualAccountService.getVirtualAccountById(
        accountId
      );

      // Check if user owns this account
      if (account.userId.toString() !== userId) {
        throw new APIError("Access denied", HttpStatus.FORBIDDEN);
      }

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Virtual account retrieved successfully",
        data: account,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get virtual account with transactions
  async getVirtualAccountWithTransactions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { accountId } = req.params;
      const { limit = 10 } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        throw new APIError("Unauthorized", HttpStatus.UNAUTHORIZED);
      }

      if (!accountId) {
        throw new APIError("Account ID is required", HttpStatus.BAD_REQUEST);
      }

      const accountWithTransactions =
        await virtualAccountService.getVirtualAccountWithTransactions(
          accountId,
          parseInt(limit as string)
        );

      // Check if user owns this account
      if (accountWithTransactions.userId.toString() !== userId) {
        throw new APIError("Access denied", HttpStatus.FORBIDDEN);
      }

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Virtual account with transactions retrieved successfully",
        data: accountWithTransactions,
      });
    } catch (error) {
      next(error);
    }
  }

  // Upgrade virtual account KYC
  async upgradeVirtualAccountKYC(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError("Unauthorized", HttpStatus.UNAUTHORIZED);
      }

      // Validate request body
      const validatedData = validateSchema(upgradeKYCSchema, req.body);

      const updatedAccount =
        await virtualAccountService.upgradeVirtualAccountKYC({
          userId,
          bvn: validatedData.bvn,
        });

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Virtual account KYC upgraded successfully",
        data: updatedAccount,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user transactions
  async getUserTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError("Unauthorized", HttpStatus.UNAUTHORIZED);
      }

      // Validate query parameters
      const validatedParams = validateSchema(getTransactionsSchema, req.query);

      const result = await virtualAccountService.getUserTransactions(
        userId,
        validatedParams.page,
        validatedParams.limit
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Transactions retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Process webhook (public endpoint)
  async processWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers["x-wiaxy-signature"] as string;
      const payload = req.body;

      if (!signature) {
        throw new APIError(
          "Missing webhook signature",
          HttpStatus.UNAUTHORIZED
        );
      }

      // Verify webhook signature
      const isValidSignature = virtualAccountService.verifyWebhookSignature(
        signature,
        JSON.stringify(payload)
      );

      if (!isValidSignature) {
        throw new APIError(
          "Invalid webhook signature",
          HttpStatus.UNAUTHORIZED
        );
      }

      // Process payment notification
      await virtualAccountService.processPaymentNotification(payload);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Webhook processed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Get available banks for user
  async getAvailableBanks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError("Unauthorized", HttpStatus.UNAUTHORIZED);
      }

      const banks = await virtualAccountService.getAvailableBanks(userId);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Available banks retrieved successfully",
        data: banks,
      });
    } catch (error) {
      next(error);
    }
  }

  // Health check endpoint
  async healthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const billstackConfig = billstackAPI.getConfig();
      const isBillstackConfigured = billstackAPI.isConfigured();

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Virtual account service is healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        billstack: {
          configured: isBillstackConfigured,
          baseURL: billstackConfig.baseURL,
          hasSecretKey: !!billstackConfig.secretKey,
          hasPublicKey: !!billstackConfig.publicKey,
          hasWebhookSecret: !!billstackConfig.webhookSecret,
          secretKeyPrefix: billstackConfig.secretKey
            ? billstackConfig.secretKey.substring(0, 10) + "..."
            : "not set",
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new VirtualAccountController();

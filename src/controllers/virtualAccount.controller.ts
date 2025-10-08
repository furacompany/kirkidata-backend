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
import { verifyBVN } from "../services/bvn.service";
import { createVirtualAccount } from "../services/palmpay.service";
import VirtualAccountModel from "../models/virtualAccount.model";

// Company information constants
const COMPANY_INFO = {
  name: "KIRKIDATA LTD",
  rcNumber: "RC8793157",
  email: "JABIRYUSUFSAID@GMAIL.COM",
} as const;

class VirtualAccountController {
  // Create virtual account for user
  async createVirtualAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError("Unauthorized", HttpStatus.UNAUTHORIZED);
      }

      // Validate request body (no fields required)
      validateSchema(createVirtualAccountSchema, req.body);

      // Check if user already has a virtual account
      const existingAccount = await VirtualAccountModel.findOne({
        userId,
        provider: "palmpay",
      });

      if (existingAccount) {
        throw new APIError(
          "Virtual account already exists for this user. Each user can only have one virtual account.",
          HttpStatus.CONFLICT
        );
      }

      // Get user details
      const user = await virtualAccountService.getUserById(userId);
      if (!user) {
        throw new APIError("User not found", HttpStatus.NOT_FOUND);
      }

      // Create virtual account name
      const virtualAccountName =
        `${user.firstName.trim()} ${user.lastName.trim()}`
          .replace(/\s+/g, " ")
          .trim();

      // Call PalmPay to create virtual account using company RC
      const palmpayRes = await createVirtualAccount({
        virtualAccountName: virtualAccountName,
        identityType: "company",
        licenseNumber: COMPANY_INFO.rcNumber,
        customerName: `${user.firstName.trim()} ${user.lastName.trim()}`,
        email: user.email,
        accountReference: `${COMPANY_INFO.name}-${userId}`,
      });

      if (!palmpayRes || palmpayRes.respCode !== "00000000") {
        throw new APIError(
          `PalmPay error: ${palmpayRes?.respMsg || "Unknown error"}`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Save to database
      const virtualAccount = await VirtualAccountModel.create({
        userId,
        provider: "palmpay",
        virtualAccountNo: palmpayRes.data.virtualAccountNo,
        virtualAccountName: palmpayRes.data.virtualAccountName
          .replace(/\n/g, "")
          .replace(/\r/g, "")
          .replace(/\s+/g, " ")
          .trim(),
        status: palmpayRes.data.status,
        identityType: palmpayRes.data.identityType,
        licenseNumber: palmpayRes.data.licenseNumber,
        customerName: palmpayRes.data.customerName
          .replace(/\n/g, "")
          .replace(/\r/g, "")
          .replace(/\s+/g, " ")
          .trim(),
        email: palmpayRes.data.email,
        accountReference: palmpayRes.data.accountReference,
        rawResponse: palmpayRes,
      });

      logger.info("Virtual account created successfully", {
        userId,
        virtualAccountNo: virtualAccount.virtualAccountNo,
        virtualAccountName: virtualAccount.virtualAccountName,
      });

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Virtual account created successfully",
        data: {
          virtualAccountNo: virtualAccount.virtualAccountNo,
          virtualAccountName: virtualAccount.virtualAccountName,
          status: virtualAccount.status,
          provider: virtualAccount.provider,
          customerName: virtualAccount.customerName,
          email: virtualAccount.email,
          accountReference: virtualAccount.accountReference,
          createdAt: virtualAccount.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user's virtual account
  async getUserVirtualAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError("Unauthorized", HttpStatus.UNAUTHORIZED);
      }

      // Find the user's virtual account
      const virtualAccount = await VirtualAccountModel.findOne({
        userId,
        provider: "palmpay",
      }).select("-rawResponse"); // Exclude raw response for security

      if (!virtualAccount) {
        throw new APIError(
          "Virtual account not found. Please generate one first.",
          HttpStatus.NOT_FOUND
        );
      }

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Virtual account retrieved successfully",
        data: {
          virtualAccountNo: virtualAccount.virtualAccountNo,
          virtualAccountName: virtualAccount.virtualAccountName,
          status: virtualAccount.status,
          provider: virtualAccount.provider,
          customerName: virtualAccount.customerName,
          email: virtualAccount.email,
          accountReference: virtualAccount.accountReference,
          createdAt: virtualAccount.createdAt,
          updatedAt: virtualAccount.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get virtual account by ID (admin only)
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

      const account = await VirtualAccountModel.findById(accountId).select(
        "-rawResponse"
      );

      if (!account) {
        throw new APIError("Virtual account not found", HttpStatus.NOT_FOUND);
      }

      // Check if user owns this account (for regular users)
      if (req.user && account.userId.toString() !== userId) {
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

      // Check if user owns this account (for regular users)
      if (req.user && accountWithTransactions.userId.toString() !== userId) {
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

  // Upgrade virtual account KYC (placeholder - PalmPay handles this differently)
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

      // Find user's virtual account
      const virtualAccount = await VirtualAccountModel.findOne({
        userId,
        provider: "palmpay",
      });

      if (!virtualAccount) {
        throw new APIError(
          "Virtual account not found. Please create one first.",
          HttpStatus.NOT_FOUND
        );
      }

      // For PalmPay, KYC is handled during account creation
      // This endpoint is kept for compatibility but doesn't perform actual KYC upgrade
      logger.info("KYC upgrade requested for PalmPay virtual account", {
        userId,
        virtualAccountNo: virtualAccount.virtualAccountNo,
        bvn: validatedData.bvn,
      });

      res.status(HttpStatus.OK).json({
        success: true,
        message: "KYC information updated successfully",
        data: {
          virtualAccountNo: virtualAccount.virtualAccountNo,
          status: virtualAccount.status,
          note: "KYC is handled during account creation with PalmPay",
        },
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

  // Get available banks for user (now only PalmPay)
  async getAvailableBanks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError("Unauthorized", HttpStatus.UNAUTHORIZED);
      }

      // Check if user already has a virtual account
      const existingAccount = await VirtualAccountModel.findOne({
        userId,
        provider: "palmpay",
      });

      const banks = {
        available: existingAccount
          ? []
          : [
              {
                bankId: "PALMPAY",
                bankName: "Palmpay Bank",
                description: "Create a virtual account with PalmPay",
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
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Virtual account service is healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        palmpay: {
          configured: true,
          baseURL: process.env.PALMPAY_API_URL,
          hasAppId: !!process.env.PALMPAY_APP_ID,
          hasMerchantId: !!process.env.PALMPAY_MERCHANT_ID,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new VirtualAccountController();

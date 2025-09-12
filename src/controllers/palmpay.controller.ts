import { Request, Response, NextFunction } from "express";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import { verifyPalmPayWebhook, getPalmPayPublicKey } from "../utils/palmpay";
import logger from "../utils/logger";
import TransactionModel from "../models/transaction.model";
import VirtualAccountModel from "../models/virtualAccount.model";
import UserModel from "../models/user.model";

export interface PalmPayWebhookData {
  orderNo: string;
  orderStatus: number; // 1: success, 2: pending, 3: failed, 4: cancelled
  createdTime: number;
  updateTime: number;
  currency: string;
  orderAmount: number; // Amount in cents
  reference?: string;
  payerAccountNo: string;
  payerAccountName: string;
  payerBankName: string;
  virtualAccountNo?: string;
  virtualAccountName?: string;
  accountReference?: string;
  sessionId?: string;
  sign?: string;
}

export const handlePalmPayWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notifyData = req.body;

    logger.info("PalmPay webhook received:", {
      orderNo: notifyData.orderNo,
      orderStatus: notifyData.orderStatus,
      orderAmount: notifyData.orderAmount,
      virtualAccountNo: notifyData.virtualAccountNo,
      hasSignature: !!notifyData.sign,
    });

    // Verify the signature if provided
    if (notifyData.sign) {
      const publicKey = getPalmPayPublicKey();
      const isVerified = verifyPalmPayWebhook(notifyData, publicKey);

      if (!isVerified) {
        logger.error("PalmPay webhook signature verification failed", {
          orderNo: notifyData.orderNo,
          sign: notifyData.sign,
        });
        throw new APIError("Invalid signature", HttpStatus.UNAUTHORIZED);
      }

      logger.info("PalmPay webhook signature verified successfully");
    } else {
      logger.warn("PalmPay webhook received without signature");
    }

    // Validate required fields according to PalmPay documentation
    const requiredFields = [
      "orderNo",
      "orderStatus",
      "createdTime",
      "updateTime",
      "currency",
      "orderAmount",
      "payerAccountNo",
      "payerAccountName",
      "payerBankName",
    ];

    for (const field of requiredFields) {
      if (!notifyData[field]) {
        throw new APIError(
          `Missing required field: ${field}`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Validate orderStatus
    if (![1, 2, 3, 4].includes(notifyData.orderStatus)) {
      throw new APIError("Invalid orderStatus", HttpStatus.BAD_REQUEST);
    }

    // Validate currency
    if (notifyData.currency !== "NGN") {
      throw new APIError("Unsupported currency", HttpStatus.BAD_REQUEST);
    }

    // Validate amount
    if (
      !Number.isInteger(notifyData.orderAmount) ||
      notifyData.orderAmount <= 0
    ) {
      throw new APIError("Invalid orderAmount", HttpStatus.BAD_REQUEST);
    }

    // Process the webhook data
    const webhookData: PalmPayWebhookData = {
      orderNo: notifyData.orderNo,
      orderStatus: notifyData.orderStatus,
      createdTime: notifyData.createdTime,
      updateTime: notifyData.updateTime,
      currency: notifyData.currency,
      orderAmount: notifyData.orderAmount,
      reference: notifyData.reference,
      payerAccountNo: notifyData.payerAccountNo,
      payerAccountName: notifyData.payerAccountName,
      payerBankName: notifyData.payerBankName,
      virtualAccountNo: notifyData.virtualAccountNo,
      virtualAccountName: notifyData.virtualAccountName,
      accountReference: notifyData.accountReference,
      sessionId: notifyData.sessionId,
      sign: notifyData.sign,
    };

    // Process the webhook using the wallet transaction service
    const transaction = await processPalmPayWebhook(webhookData);

    logger.info("PalmPay webhook processed successfully", {
      orderNo: webhookData.orderNo,
      transactionId: transaction._id,
      status: transaction.status,
      amount: webhookData.orderAmount,
    });

    // Return success response to PalmPay (must be exactly "success" as plain text)
    res.status(200).send("success");
  } catch (error) {
    logger.error("Error processing PalmPay webhook", {
      error: error instanceof Error ? error.message : "Unknown error",
      body: req.body,
    });

    // Return error response to PalmPay
    res.status(400).send("error");
  }
};

/**
 * Process PalmPay webhook and update user wallet
 */
async function processPalmPayWebhook(
  webhookData: PalmPayWebhookData
): Promise<any> {
  try {
    // Find the virtual account
    let virtualAccount = null;
    if (webhookData.virtualAccountNo) {
      virtualAccount = await VirtualAccountModel.findOne({
        virtualAccountNo: webhookData.virtualAccountNo,
      });
    }

    if (!virtualAccount) {
      logger.error("Virtual account not found for PalmPay webhook", {
        virtualAccountNo: webhookData.virtualAccountNo,
        orderNo: webhookData.orderNo,
      });
      throw new APIError("Virtual account not found", HttpStatus.NOT_FOUND);
    }

    // Find the user
    const user = await UserModel.findById(virtualAccount.userId);
    if (!user) {
      logger.error("User not found for PalmPay webhook", {
        userId: virtualAccount.userId,
        orderNo: webhookData.orderNo,
      });
      throw new APIError("User not found", HttpStatus.NOT_FOUND);
    }

    // Check if transaction already exists
    let transaction = await TransactionModel.findOne({
      reference: webhookData.orderNo,
    });

    if (transaction) {
      logger.info("Transaction already exists, updating status", {
        transactionId: transaction._id,
        orderNo: webhookData.orderNo,
        currentStatus: transaction.status,
        newStatus: getTransactionStatus(webhookData.orderStatus),
      });

      // Update existing transaction
      transaction.status = getTransactionStatus(webhookData.orderStatus);
      transaction.updatedAt = new Date();
      await transaction.save();

      return transaction;
    }

    // Convert amount from cents to NGN
    const amountInNGN = webhookData.orderAmount / 100;

    // Create new transaction
    transaction = new TransactionModel({
      userId: user._id,
      virtualAccountId: virtualAccount._id,
      type: "funding",
      amount: amountInNGN,
      currency: webhookData.currency,
      status: getTransactionStatus(webhookData.orderStatus),
      reference: webhookData.orderNo,
      description: `Wallet funding via PalmPay - ${webhookData.payerAccountName}`,
      metadata: {
        payerAccountNumber: webhookData.payerAccountNo,
        payerFirstName: webhookData.payerAccountName.split(" ")[0],
        payerLastName: webhookData.payerAccountName
          .split(" ")
          .slice(1)
          .join(" "),
        bankName: webhookData.payerBankName,
        accountNumber: webhookData.virtualAccountNo,
        accountName: webhookData.virtualAccountName,
        palmpayOrderNo: webhookData.orderNo,
        palmpayOrderStatus: webhookData.orderStatus,
        palmpaySessionId: webhookData.sessionId,
      },
    });

    await transaction.save();

    // If transaction is successful, credit user wallet
    if (webhookData.orderStatus === 1) {
      user.wallet += amountInNGN;
      await user.save();

      logger.info("User wallet credited via PalmPay webhook", {
        userId: user._id,
        amount: amountInNGN,
        newBalance: user.wallet,
        transactionId: transaction._id,
      });
    }

    return transaction;
  } catch (error) {
    logger.error("Error processing PalmPay webhook data", error);
    throw error;
  }
}

/**
 * Convert PalmPay order status to our transaction status
 */
function getTransactionStatus(
  orderStatus: number
): "completed" | "pending" | "failed" | "cancelled" {
  switch (orderStatus) {
    case 1:
      return "completed";
    case 2:
      return "pending";
    case 3:
      return "failed";
    case 4:
      return "cancelled";
    default:
      return "pending";
  }
}

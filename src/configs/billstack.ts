import dotenv from "dotenv";
dotenv.config();
import axios, { AxiosInstance } from "axios";
import crypto from "crypto";
import logger from "../utils/logger";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import { BankType } from "../constants/banks.constant";

export interface BillStackConfig {
  baseURL: string;
  secretKey: string;
  publicKey: string;
}

export interface CreateVirtualAccountRequest {
  email: string;
  reference: string;
  firstName: string;
  lastName: string;
  phone: string;
  bank: BankType;
}

export interface CreateVirtualAccountResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    account: Array<{
      account_number: string;
      account_name: string;
      bank_name: string;
      bank_id: string;
      created_at: string;
    }>;
    meta: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export interface VirtualAccountKYCRequest {
  customer: string; // email
  bvn: string;
}

export interface VirtualAccountKYCResponse {
  responseCode: string;
  status: boolean;
  message: string;
}

export interface BillStackWebhookPayload {
  event: string; // "PAYMENT_NOTIFICATION" (note the typo in BillStack docs)
  data: {
    type: string;
    reference: string;
    merchant_reference: string;
    wiaxy_ref: string;
    transaction_ref: string;
    amount: string;
    created_at: string;
    account: {
      account_name: string;
      account_number: string;
      bank_id: string;
      bank_name: string;
      created_at: string;
    };
    payer: {
      account_name: string;
      account_number: string;
      bank_id: string;
      bank_name: string;
      created_at: string;
    };
    customer: {
      email: string;
      firstName: string;
      lastName: string;
    };
  };
}

class BillStackAPI {
  private config: BillStackConfig;
  private client: AxiosInstance;

  constructor() {
    this.config = {
      baseURL: process.env.BILLSTACK_BASE_URL || "https://api.billstack.co/v2",
      secretKey: process.env.BILLSTACK_SECRET_KEY || "",
      publicKey: process.env.BILLSTACK_PUBLIC_KEY || "",
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.secretKey}`,
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(
          `BillStack API Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        logger.error("BillStack API Request Error:", error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.info(
          `BillStack API Response: ${response.status} ${response.config.url}`
        );
        return response;
      },
      (error) => {
        logger.error("BillStack API Response Error:", {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  // Create virtual account
  async createVirtualAccount(
    request: CreateVirtualAccountRequest
  ): Promise<CreateVirtualAccountResponse> {
    try {
      logger.info(`Creating virtual account for bank: ${request.bank}`, {
        email: request.email,
        reference: request.reference,
        firstName: request.firstName,
        lastName: request.lastName,
        phone: request.phone,
        bank: request.bank,
      });

      // Log the full request details
      logger.info("BillStack API Request Details:", {
        url: `${this.config.baseURL}/thirdparty/generateVirtualAccount/`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.secretKey.substring(0, 10)}...`,
        },
        body: request,
      });

      const response = await this.client.post<CreateVirtualAccountResponse>(
        "/thirdparty/generateVirtualAccount/",
        request
      );

      logger.info(
        `Virtual account created successfully for bank: ${request.bank}`,
        {
          reference: response.data.data.reference,
          accountNumber: response.data.data.account?.[0]?.account_number,
        }
      );

      return response.data;
    } catch (error: any) {
      // Enhanced error logging
      logger.error(
        `Failed to create virtual account - Detailed Error: ${JSON.stringify({
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          bank: request.bank,
          reference: request.reference,
          config: error.config
            ? {
                url: error.config.url,
                method: error.config.method,
              }
            : null,
          isAxiosError: error.isAxiosError,
          code: error.code,
        })}`
      );

      if (error.response?.data) {
        const errorMessage =
          error.response.data.message ||
          error.response.data.error ||
          "Failed to create virtual account";
        logger.error(
          `BillStack API Error Response: ${JSON.stringify(error.response.data)}`
        );
        throw new APIError(
          `${errorMessage} (Bank: ${request.bank})`,
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      throw new APIError(
        `Failed to create virtual account for ${request.bank}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Upgrade virtual account with KYC
  async upgradeVirtualAccountKYC(
    request: VirtualAccountKYCRequest
  ): Promise<VirtualAccountKYCResponse> {
    try {
      logger.info("Upgrading virtual account KYC:", {
        customer: request.customer,
        bvn: request.bvn ? `${request.bvn.substring(0, 3)}***` : "not provided",
      });

      // Log the full request details
      logger.info("BillStack KYC API Request Details:", {
        url: `${this.config.baseURL}/thirdparty/upgradeVirtualAccount/`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.secretKey.substring(0, 10)}...`,
        },
        body: request,
      });

      const response = await this.client.post<VirtualAccountKYCResponse>(
        "/thirdparty/upgradeVirtualAccount/",
        request
      );

      logger.info("Virtual account KYC upgraded successfully:", {
        responseCode: response.data.responseCode,
        status: response.data.status,
        message: response.data.message,
      });

      return response.data;
    } catch (error: any) {
      // Enhanced error logging
      logger.error(
        `Failed to upgrade virtual account KYC - Detailed Error: ${JSON.stringify(
          {
            error: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            customer: request.customer,
            config: error.config
              ? {
                  url: error.config.url,
                  method: error.config.method,
                }
              : null,
            isAxiosError: error.isAxiosError,
            code: error.code,
          }
        )}`
      );

      if (error.response?.data) {
        const errorMessage =
          error.response.data.message ||
          error.response.data.error ||
          "Failed to upgrade virtual account KYC";
        logger.error(
          `BillStack KYC API Error Response: ${JSON.stringify(
            error.response.data
          )}`
        );
        throw new APIError(
          `${errorMessage} (Customer: ${request.customer})`,
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      throw new APIError(
        `Failed to upgrade virtual account KYC for ${request.customer}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(signature: string, payload: string): boolean {
    try {
      logger.info("Verifying webhook signature:", {
        receivedSignature: signature,
        secretKeyExists: !!this.config.secretKey,
        secretKeyPrefix: this.config.secretKey
          ? this.config.secretKey.substring(0, 10) + "..."
          : "not set",
      });

      // Use the BillStack secret key directly for MD5 hash
      const expectedSignature = crypto
        .createHash("md5")
        .update(this.config.secretKey)
        .digest("hex");

      const isValid = signature === expectedSignature;

      logger.info("Webhook signature verification result:", {
        isValid,
        expectedSignature,
        receivedSignature: signature,
      });

      return isValid;
    } catch (error) {
      logger.error("Webhook signature verification failed:", error);
      return false;
    }
  }

  // Parse webhook payload
  parseWebhookPayload(payload: any): BillStackWebhookPayload {
    try {
      return payload as BillStackWebhookPayload;
    } catch (error) {
      logger.error("Failed to parse webhook payload:", error);
      throw new APIError(
        "Invalid webhook payload format",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Validate webhook payload
  validateWebhookPayload(payload: BillStackWebhookPayload): boolean {
    logger.info("Validating webhook payload:", {
      event: payload.event,
      type: payload.data?.type,
      hasReference: !!payload.data?.reference,
      hasMerchantReference: !!payload.data?.merchant_reference,
      hasAmount: !!payload.data?.amount,
      hasAccountNumber: !!payload.data?.account?.account_number,
      hasPayerAccountNumber: !!payload.data?.payer?.account_number,
      hasCustomer: !!payload.data?.customer?.email,
    });

    const isValid = Boolean(
      payload.event === "PAYMENT_NOTIFICATION" &&
        payload.data.type === "RESERVED_ACCOUNT_TRANSACTION" &&
        payload.data.reference &&
        payload.data.merchant_reference &&
        payload.data.amount &&
        payload.data.account?.account_number &&
        payload.data.payer?.account_number &&
        payload.data.customer?.email
    );

    logger.info("Webhook payload validation result:", { isValid });
    return isValid;
  }

  // Get configuration
  getConfig(): BillStackConfig {
    return { ...this.config };
  }

  // Check if API is properly configured
  isConfigured(): boolean {
    const hasBaseURL = this.config.baseURL !== "";
    const hasSecretKey = this.config.secretKey !== "";
    const hasPublicKey = this.config.publicKey !== "";
    // Webhook secret is not needed since we use the main secret key

    return hasBaseURL && hasSecretKey && hasPublicKey;
  }
}

export default new BillStackAPI();

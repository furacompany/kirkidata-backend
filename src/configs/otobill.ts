import dotenv from "dotenv";
dotenv.config();
import axios, { AxiosInstance } from "axios";
import logger from "../utils/logger";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";

export interface OtoBillConfig {
  baseURL: string;
  apiKey: string;
}

export interface OtoBillProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  walletBalance: number;
  formattedWalletBalance: string;
  apiKeyName: string;
  ipWhitelist: string;
  apiKeyCreatedAt: string;
  apiKeyLastUsed: string;
  isEmailVerified: boolean;
  hasSetPin: boolean;
  isActive: boolean;
}

export interface OtoBillWalletBalance {
  balance: number;
  formattedBalance: string;
  userId: string;
  email: string;
}

export interface OtoBillNetwork {
  id: string;
  name: string;
  status: string;
  isActive: boolean;
  airtimePricing: any;
}

export interface OtoBillDataPlan {
  planId: string;
  id: string;
  name: string;
  networkName: string;
  planType: string;
  validityDays: number;
  originalPrice: number;
  price: number;
  formattedPrice: string;
  profit: number;
  formattedProfit: string;
  status?: string;
  isVisible?: boolean;
  customerPrice?: number;
  agentPrice?: number;
  developerPrice?: number;
  finalPrice?: number;
}

export interface OtoBillAirtimePurchase {
  networkName: string;
  phoneNumber: string;
  amount: number;
}

export interface OtoBillDataPurchase {
  planId: string;
  phoneNumber: string;
}

export interface OtoBillTransaction {
  id: string;
  transactionId: string;
  topupmateRef: string;
  amount: number;
  status: string;
  description: string;
  networkName?: string;
  phoneNumber: string;
  planId?: string;
  userRole: string;
  createdAt: string;
  processedAt?: string;
  transactionType?: string;
  topupmateResponse?: any;
}

export interface OtoBillPricingSummary {
  networks: {
    total: number;
    active: number;
  };
  dataPlans: {
    total: number;
    active: number;
    visible: number;
  };
  airtimePricing: {
    total: number;
    active: number;
  };
}

class OtoBillAPI {
  private config: OtoBillConfig;
  private client: AxiosInstance;

  constructor() {
    this.config = {
      baseURL:
        process.env.OTObill_BASE_URL ||
        "https://api.otobill.com/api/v1/developer",
      apiKey: process.env.OTObill_API_KEY || "",
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.config.apiKey,
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(
          `OtoBill API Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        logger.error("OtoBill API Request Error:", error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.info(
          `OtoBill API Response: ${response.status} ${response.config.url}`
        );
        return response;
      },
      (error) => {
        logger.error("OtoBill API Response Error:", {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  // Get developer profile
  async getProfile(): Promise<OtoBillProfile> {
    try {
      const response = await this.client.get<{
        success: boolean;
        data: OtoBillProfile;
      }>("/profile");

      if (!response.data.success) {
        throw new APIError(
          "Failed to get OtoBill profile",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return response.data.data;
    } catch (error: any) {
      logger.error("Failed to get OtoBill profile:", error);
      throw new APIError(
        `Failed to get OtoBill profile: ${
          error.response?.data?.message || error.message
        }`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Get wallet balance
  async getWalletBalance(): Promise<OtoBillWalletBalance> {
    try {
      const response = await this.client.get<{
        success: boolean;
        data: OtoBillWalletBalance;
      }>("/wallet/balance");

      if (!response.data.success) {
        throw new APIError(
          "Failed to get OtoBill wallet balance",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return response.data.data;
    } catch (error: any) {
      logger.error("Failed to get OtoBill wallet balance:", error);
      throw new APIError(
        `Failed to get OtoBill wallet balance: ${
          error.response?.data?.message || error.message
        }`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Get available networks
  async getNetworks(): Promise<OtoBillNetwork[]> {
    try {
      const response = await this.client.get<{
        success: boolean;
        data: OtoBillNetwork[];
      }>("/networks");

      if (!response.data.success) {
        throw new APIError(
          "Failed to get OtoBill networks",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return response.data.data;
    } catch (error: any) {
      logger.error("Failed to get OtoBill networks:", error);
      throw new APIError(
        `Failed to get OtoBill networks: ${
          error.response?.data?.message || error.message
        }`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Get data plans for a network
  async getDataPlans(
    networkName: string,
    planType?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    plans: OtoBillDataPlan[];
    total: number;
    page: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    try {
      let url = `/data-plans/network/${networkName}`;
      const params = new URLSearchParams();

      if (planType) {
        params.append("planType", planType);
      }
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await this.client.get<{ success: boolean; data: any }>(
        url
      );

      if (!response.data.success) {
        throw new APIError(
          "Failed to get OtoBill data plans",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return response.data.data;
    } catch (error: any) {
      logger.error("Failed to get OtoBill data plans:", error);
      throw new APIError(
        `Failed to get OtoBill data plans: ${
          error.response?.data?.message || error.message
        }`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Get data plan types for a network
  async getDataPlanTypes(networkName: string): Promise<string[]> {
    try {
      const response = await this.client.get<{
        success: boolean;
        data: string[];
      }>(`/data-plans/network/${networkName}/types`);

      if (!response.data.success) {
        throw new APIError(
          "Failed to get OtoBill data plan types",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return response.data.data;
    } catch (error: any) {
      logger.error("Failed to get OtoBill data plan types:", error);
      throw new APIError(
        `Failed to get OtoBill data plan types: ${
          error.response?.data?.message || error.message
        }`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Get data plans by network and type
  async getDataPlansByType(
    networkName: string,
    planType: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    plans: OtoBillDataPlan[];
    total: number;
    page: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    try {
      const url = `/data-plans/network/${networkName}/type/${planType}?page=${page}&limit=${limit}`;
      const response = await this.client.get<{ success: boolean; data: any }>(
        url
      );

      if (!response.data.success) {
        throw new APIError(
          "Failed to get OtoBill data plans by type",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return response.data.data;
    } catch (error: any) {
      logger.error("Failed to get OtoBill data plans by type:", error);
      throw new APIError(
        `Failed to get OtoBill data plans by type: ${
          error.response?.data?.message || error.message
        }`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Buy airtime
  async buyAirtime(
    purchaseData: OtoBillAirtimePurchase
  ): Promise<OtoBillTransaction> {
    try {
      const response = await this.client.post<{
        success: boolean;
        data: OtoBillTransaction;
      }>("/buy/airtime", purchaseData);

      if (!response.data.success) {
        throw new APIError(
          "Failed to buy airtime",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return response.data.data;
    } catch (error: any) {
      logger.error("Failed to buy airtime:", error);
      throw new APIError(
        `Failed to buy airtime: ${
          error.response?.data?.message || error.message
        }`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Buy data
  async buyData(
    purchaseData: OtoBillDataPurchase
  ): Promise<OtoBillTransaction> {
    try {
      const response = await this.client.post<{
        success: boolean;
        data: OtoBillTransaction;
      }>("/buy/data", purchaseData);

      if (!response.data.success) {
        throw new APIError(
          "Failed to buy data",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return response.data.data;
    } catch (error: any) {
      logger.error("Failed to buy data:", error);
      throw new APIError(
        `Failed to buy data: ${error.response?.data?.message || error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Check transaction status
  async checkTransactionStatus(
    topupmateRef: string
  ): Promise<OtoBillTransaction> {
    try {
      const response = await this.client.get<{
        success: boolean;
        data: OtoBillTransaction;
      }>(`/transaction/status/${topupmateRef}`);

      if (!response.data.success) {
        throw new APIError(
          "Failed to check transaction status",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return response.data.data;
    } catch (error: any) {
      logger.error("Failed to check transaction status:", error);
      throw new APIError(
        `Failed to check transaction status: ${
          error.response?.data?.message || error.message
        }`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Get transaction history
  async getTransactions(
    page: number = 1,
    limit: number = 20
  ): Promise<{
    transactions: OtoBillTransaction[];
    total: number;
    page: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    try {
      const url = `/transactions?page=${page}&limit=${limit}`;
      const response = await this.client.get<{ success: boolean; data: any }>(
        url
      );

      if (!response.data.success) {
        throw new APIError(
          "Failed to get OtoBill transactions",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return response.data.data;
    } catch (error: any) {
      logger.error("Failed to get OtoBill transactions:", error);
      throw new APIError(
        `Failed to get OtoBill transactions: ${
          error.response?.data?.message || error.message
        }`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Get specific transaction
  async getTransaction(transactionId: string): Promise<OtoBillTransaction> {
    try {
      const response = await this.client.get<{
        success: boolean;
        data: OtoBillTransaction;
      }>(`/transactions/${transactionId}`);

      if (!response.data.success) {
        throw new APIError(
          "Failed to get OtoBill transaction",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return response.data.data;
    } catch (error: any) {
      logger.error("Failed to get OtoBill transaction:", error);
      throw new APIError(
        `Failed to get OtoBill transaction: ${
          error.response?.data?.message || error.message
        }`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Get pricing summary
  async getPricingSummary(): Promise<OtoBillPricingSummary> {
    try {
      const response = await this.client.get<{
        success: boolean;
        data: OtoBillPricingSummary;
      }>("/pricing/summary");

      if (!response.data.success) {
        throw new APIError(
          "Failed to get OtoBill pricing summary",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return response.data.data;
    } catch (error: any) {
      logger.error("Failed to get OtoBill pricing summary:", error);
      throw new APIError(
        `Failed to get OtoBill pricing summary: ${
          error.response?.data?.message || error.message
        }`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Get configuration
  getConfig(): OtoBillConfig {
    return { ...this.config };
  }

  // Check if API is properly configured
  isConfigured(): boolean {
    const hasBaseURL = this.config.baseURL !== "";
    const hasApiKey = this.config.apiKey !== "";

    return hasBaseURL && hasApiKey;
  }
}

export default new OtoBillAPI();

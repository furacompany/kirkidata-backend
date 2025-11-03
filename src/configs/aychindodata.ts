import dotenv from "dotenv";
dotenv.config();
import axios, { AxiosInstance } from "axios";
import logger from "../utils/logger";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import { getNetworkId } from "../utils/networkMapping";

export interface AychindodataConfig {
  baseURL: string;
  username: string;
  password: string;
  accessToken?: string;
}

export interface AychindodataUserInfo {
  status: string;
  AccessToken: string;
  balance: string;
  username: string;
}

export interface AychindodataAirtimePurchase {
  network: number; // 1=MTN, 2=AIRTEL, 3=GLO, 4=9MOBILE
  phone: string;
  plan_type: string; // "VTU"
  amount: number;
  bypass: boolean;
  "request-id": string;
}

export interface AychindodataDataPurchase {
  network: number; // 1=MTN, 2=AIRTEL, 3=GLO, 4=9MOBILE
  phone: string;
  data_plan: number; // Numeric plan ID from Aychindodata
  bypass: boolean;
  "request-id": string;
}

export interface AychindodataAirtimeResponse {
  network: string;
  "request-id": string;
  amount: number;
  discount: number;
  status: string;
  message: string;
  phone_number: string;
  oldbal: string;
  newbal: number;
  system: string;
  plan_type: string;
  wallet_vending: string;
}

export interface AychindodataDataResponse {
  network: string;
  "request-id": string;
  amount: string;
  dataplan: string;
  status: string;
  message: string;
  phone_number: string;
  oldbal: string;
  newbal: number;
  system: string;
  plan_type: string;
  wallet_vending: string;
}

class AychindodataAPI {
  private config: AychindodataConfig;
  private client: AxiosInstance;

  constructor() {
    this.config = {
      baseURL: process.env.AYCHINDODATA_BASE_URL || "https://aychindodata.com/api",
      username: process.env.AYCHINDODATA_USERNAME || "",
      password: process.env.AYCHINDODATA_PASSWORD || "",
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(
          `Aychindodata API Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        logger.error("Aychindodata API Request Error:", error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.info(
          `Aychindodata API Response: ${response.status} ${response.config.url}`
        );
        return response;
      },
      (error) => {
        logger.error("Aychindodata API Response Error:", {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get or refresh access token
   */
  private async getAccessToken(): Promise<string> {
    try {
      if (!this.config.username || !this.config.password) {
        throw new APIError(
          "Aychindodata username and password are required",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Generate Basic Auth token
      const credentials = `${this.config.username}:${this.config.password}`;
      const base64Credentials = Buffer.from(credentials).toString("base64");

      const response = await this.client.get<AychindodataUserInfo>("/user", {
        headers: {
          Authorization: `Basic ${base64Credentials}`,
        },
      });

      if (response.data.status !== "success") {
        throw new APIError(
          "Failed to get Aychindodata access token",
          HttpStatus.UNAUTHORIZED
        );
      }

      this.config.accessToken = response.data.AccessToken;
      return this.config.accessToken;
    } catch (error: any) {
      logger.error("Failed to get Aychindodata access token:", error);
      throw new APIError(
        `Failed to get Aychindodata access token: ${
          error.response?.data?.message || error.message
        }`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get user info and wallet balance
   */
  async getUserInfo(): Promise<AychindodataUserInfo> {
    try {
      const token = await this.getAccessToken();

      const response = await this.client.get<AychindodataUserInfo>("/user", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error("Failed to get Aychindodata user info:", error);
      throw new APIError(
        `Failed to get Aychindodata user info: ${
          error.response?.data?.message || error.message
        }`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Buy airtime
   */
  async buyAirtime(
    networkName: string,
    phone: string,
    amount: number,
    requestId: string
  ): Promise<AychindodataAirtimeResponse> {
    try {
      const token = await this.getAccessToken();
      const networkId = getNetworkId(networkName);

      // Format phone number (remove leading 0 if present)
      const formattedPhone = phone.startsWith("0") ? phone : `0${phone}`;

      const payload: AychindodataAirtimePurchase = {
        network: networkId,
        phone: formattedPhone,
        plan_type: "VTU",
        amount: amount,
        bypass: false,
        "request-id": requestId,
      };

      const response = await this.client.post<AychindodataAirtimeResponse>(
        "/topup",
        payload,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error("Failed to buy airtime from Aychindodata:", error);
      throw new APIError(
        `Failed to buy airtime: ${
          error.response?.data?.message || error.message
        }`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Buy data
   */
  async buyData(
    networkName: string,
    phone: string,
    dataPlanId: number,
    requestId: string
  ): Promise<AychindodataDataResponse> {
    try {
      const token = await this.getAccessToken();
      const networkId = getNetworkId(networkName);

      // Format phone number (remove leading 0 if present)
      const formattedPhone = phone.startsWith("0") ? phone : `0${phone}`;

      const payload: AychindodataDataPurchase = {
        network: networkId,
        phone: formattedPhone,
        data_plan: dataPlanId,
        bypass: false,
        "request-id": requestId,
      };

      const response = await this.client.post<AychindodataDataResponse>(
        "/data",
        payload,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error("Failed to buy data from Aychindodata:", error);
      throw new APIError(
        `Failed to buy data: ${
          error.response?.data?.message || error.message
        }`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Check if API is properly configured
   */
  isConfigured(): boolean {
    const hasBaseURL = this.config.baseURL !== "";
    const hasUsername = this.config.username !== "";
    const hasPassword = this.config.password !== "";

    return hasBaseURL && hasUsername && hasPassword;
  }

  /**
   * Get configuration (without sensitive data)
   */
  getConfig(): {
    baseURL: string;
    hasUsername: boolean;
    hasPassword: boolean;
  } {
    return {
      baseURL: this.config.baseURL,
      hasUsername: !!this.config.username,
      hasPassword: !!this.config.password,
    };
  }
}

export default new AychindodataAPI();


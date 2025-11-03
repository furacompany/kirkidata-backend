import aychindodataAPI from "../configs/aychindodata";
import logger from "../utils/logger";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import { getAllNetworkNames } from "../utils/networkMapping";

class AychindodataService {
  /**
   * Get Aychindodata user info and wallet balance
   */
  async getUserInfo() {
    try {
      if (!aychindodataAPI.isConfigured()) {
        throw new APIError(
          "Aychindodata API is not configured",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const userInfo = await aychindodataAPI.getUserInfo();
      return userInfo;
    } catch (error) {
      logger.error("Failed to get Aychindodata user info:", error);
      throw error;
    }
  }

  /**
   * Get available networks
   */
  async getNetworks() {
    try {
      const networkNames = getAllNetworkNames();
      
      const networks = networkNames.map((name) => ({
        id: name,
        name: name,
        status: "On",
        isActive: true,
      }));

      return networks;
    } catch (error) {
      logger.error("Failed to get networks:", error);
      throw error;
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
  ) {
    try {
      if (!aychindodataAPI.isConfigured()) {
        throw new APIError(
          "Aychindodata API is not configured",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const response = await aychindodataAPI.buyAirtime(
        networkName,
        phone,
        amount,
        requestId
      );

      return response;
    } catch (error) {
      logger.error("Failed to buy airtime from Aychindodata:", error);
      throw error;
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
  ) {
    try {
      if (!aychindodataAPI.isConfigured()) {
        throw new APIError(
          "Aychindodata API is not configured",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const response = await aychindodataAPI.buyData(
        networkName,
        phone,
        dataPlanId,
        requestId
      );

      return response;
    } catch (error) {
      logger.error("Failed to buy data from Aychindodata:", error);
      throw error;
    }
  }

  /**
   * Check if API is properly configured
   */
  isConfigured(): boolean {
    return aychindodataAPI.isConfigured();
  }

  /**
   * Get configuration (without sensitive data)
   */
  getConfig() {
    return aychindodataAPI.getConfig();
  }
}

export default new AychindodataService();


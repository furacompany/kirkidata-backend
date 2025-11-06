import DataPlanModel, { IDataPlan } from "../models/dataPlan.model";
import logger from "../utils/logger";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import { isValidNetworkName } from "../utils/networkMapping";
import mongoose from "mongoose";

export interface CreateDataPlanData {
  name: string;
  networkName: string;
  planType: string;
  dataSize: string;
  validityDays: number;
  originalPrice?: number;
  adminPrice: number;
  planId: string; // Required - Aychindodata plan ID (e.g., "9", "7", "8") - used for both DB and API calls
  isActive?: boolean;
}

export interface UpdateDataPlanData {
  name?: string;
  networkName?: string;
  planType?: string;
  dataSize?: string;
  validityDays?: number;
  originalPrice?: number;
  adminPrice?: number;
  planId?: string;
  isActive?: boolean;
}

export interface DataPlanFilters {
  networkName?: string;
  planType?: string;
  isActive?: boolean;
}

class DataPlanService {
  /**
   * Create a new data plan
   */
  async createDataPlan(data: CreateDataPlanData): Promise<IDataPlan> {
    try {
      // Validate network name
      if (!isValidNetworkName(data.networkName)) {
        throw new APIError(
          `Invalid network name: ${data.networkName}. Must be one of: MTN, AIRTEL, GLO, 9MOBILE`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Check if planId already exists (required and must be unique)
      if (!data.planId || data.planId.trim() === "") {
        throw new APIError(
          "Plan ID (Aychindodata plan ID) is required",
          HttpStatus.BAD_REQUEST
        );
      }

      const existingPlan = await DataPlanModel.findOne({
        planId: data.planId.trim(),
      });

      if (existingPlan) {
        throw new APIError(
          `Data plan with Plan ID "${data.planId}" already exists`,
          HttpStatus.CONFLICT
        );
      }

      // Generate custom ID
      const customId = `PLAN_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const dataPlan = new DataPlanModel({
        ...data,
        planId: data.planId.trim(), // Ensure trimmed planId
        customId,
        isActive: data.isActive !== undefined ? data.isActive : true,
      });

      await dataPlan.save();

      logger.info(`Data plan created: ${dataPlan._id} - ${dataPlan.name}`);
      return dataPlan;
    } catch (error) {
      logger.error("Failed to create data plan:", error);
      throw error;
    }
  }

  /**
   * Get data plans with filters and pagination
   */
  async getDataPlans(
    filters: DataPlanFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const query: any = {};

      if (filters.networkName) {
        query.networkName = filters.networkName;
      }

      if (filters.planType) {
        query.planType = filters.planType;
      }

      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      const skip = (page - 1) * limit;

      const [dataPlans, total] = await Promise.all([
        DataPlanModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        DataPlanModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        plans: dataPlans,
        total,
        page,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      logger.error("Failed to get data plans:", error);
      throw error;
    }
  }

  /**
   * Get data plan by ID (MongoDB _id or planId)
   */
  async getDataPlanById(id: string): Promise<IDataPlan> {
    try {
      let dataPlan;

      // Check if id is a valid MongoDB ObjectId
      const isValidObjectId = mongoose.Types.ObjectId.isValid(id);

      if (isValidObjectId) {
        // Try to find by MongoDB _id first
        dataPlan = await DataPlanModel.findById(id);
      }

      // If not found by _id, try by planId
      if (!dataPlan) {
        dataPlan = await DataPlanModel.findOne({
          planId: id,
          isActive: true,
        });
      }

      if (!dataPlan) {
        throw new APIError("Data plan not found", HttpStatus.NOT_FOUND);
      }

      return dataPlan;
    } catch (error) {
      logger.error("Failed to get data plan by ID:", error);
      throw error;
    }
  }

  /**
   * Update data plan by ID (MongoDB _id or planId)
   */
  async updateDataPlan(
    id: string,
    data: UpdateDataPlanData
  ): Promise<IDataPlan> {
    try {
      let dataPlan;

      // Check if id is a valid MongoDB ObjectId
      const isValidObjectId = mongoose.Types.ObjectId.isValid(id);

      if (isValidObjectId) {
        // Try to find by MongoDB _id first
        dataPlan = await DataPlanModel.findById(id);
      }

      // If not found by _id, try by planId
      if (!dataPlan) {
        dataPlan = await DataPlanModel.findOne({
          planId: id,
        });
      }

      if (!dataPlan) {
        throw new APIError("Data plan not found", HttpStatus.NOT_FOUND);
      }

      // Validate network name if provided
      if (data.networkName && !isValidNetworkName(data.networkName)) {
        throw new APIError(
          `Invalid network name: ${data.networkName}. Must be one of: MTN, AIRTEL, GLO, 9MOBILE`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Check if planId is being changed and if it conflicts
      if (data.planId !== undefined) {
        const trimmedPlanId = data.planId.trim();

        if (trimmedPlanId === "") {
          throw new APIError("Plan ID cannot be empty", HttpStatus.BAD_REQUEST);
        }

        // Check if the new planId conflicts with another plan
        if (trimmedPlanId !== dataPlan.planId) {
          const existingPlan = await DataPlanModel.findOne({
            planId: trimmedPlanId,
          });

          if (existingPlan) {
            throw new APIError(
              `Data plan with Plan ID "${trimmedPlanId}" already exists`,
              HttpStatus.CONFLICT
            );
          }
        }
      }

      // Update fields
      if (data.name !== undefined) dataPlan.name = data.name;
      if (data.networkName !== undefined)
        dataPlan.networkName = data.networkName;
      if (data.planType !== undefined) dataPlan.planType = data.planType;
      if (data.dataSize !== undefined) dataPlan.dataSize = data.dataSize;
      if (data.validityDays !== undefined)
        dataPlan.validityDays = data.validityDays;
      if (data.originalPrice !== undefined)
        dataPlan.originalPrice = data.originalPrice;
      if (data.adminPrice !== undefined) dataPlan.adminPrice = data.adminPrice;
      if (data.planId !== undefined) dataPlan.planId = data.planId.trim();
      if (data.isActive !== undefined) dataPlan.isActive = data.isActive;

      await dataPlan.save();

      logger.info(`Data plan updated: ${dataPlan._id} - ${dataPlan.name}`);
      return dataPlan;
    } catch (error) {
      logger.error("Failed to update data plan:", error);
      throw error;
    }
  }

  /**
   * Delete data plan (hard delete - permanently remove from database)
   * Can be deleted by MongoDB _id or planId
   */
  async deleteDataPlan(id: string): Promise<void> {
    try {
      let dataPlan;
      let deletedPlan;

      // Check if id is a valid MongoDB ObjectId
      const isValidObjectId = mongoose.Types.ObjectId.isValid(id);

      if (isValidObjectId) {
        // Try to delete by MongoDB _id first
        deletedPlan = await DataPlanModel.findByIdAndDelete(id);
        if (deletedPlan) {
          dataPlan = deletedPlan;
        }
      }

      // If not found by _id, try by planId
      if (!deletedPlan) {
        dataPlan = await DataPlanModel.findOne({
          planId: id,
        });
        if (dataPlan) {
          deletedPlan = await DataPlanModel.findByIdAndDelete(dataPlan._id);
        }
      }

      if (!dataPlan || !deletedPlan) {
        throw new APIError("Data plan not found", HttpStatus.NOT_FOUND);
      }

      logger.info(`Data plan deleted: ${dataPlan._id} - ${dataPlan.name}`);
    } catch (error) {
      logger.error("Failed to delete data plan:", error);
      throw error;
    }
  }

  /**
   * Get distinct plan types for a network
   */
  async getPlanTypes(networkName?: string): Promise<string[]> {
    try {
      const query: any = { isActive: true };
      if (networkName) {
        query.networkName = networkName;
      }

      const planTypes = await DataPlanModel.distinct("planType", query);
      return planTypes;
    } catch (error) {
      logger.error("Failed to get plan types:", error);
      throw error;
    }
  }

  /**
   * Get data plans by network and type
   */
  async getDataPlansByNetworkAndType(
    networkName: string,
    planType: string,
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const query = {
        networkName,
        planType,
        isActive: true,
      };

      const skip = (page - 1) * limit;

      const [dataPlans, total] = await Promise.all([
        DataPlanModel.find(query)
          .sort({ adminPrice: 1 }) // Sort by price ascending
          .skip(skip)
          .limit(limit),
        DataPlanModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        plans: dataPlans,
        total,
        page,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      logger.error("Failed to get data plans by network and type:", error);
      throw error;
    }
  }
}

export default new DataPlanService();

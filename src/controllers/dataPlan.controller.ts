import { Request, Response, NextFunction } from "express";
import dataPlanService from "../services/dataPlan.service";
import { validateSchema } from "../validations/purchase.validation";
import {
  createDataPlanSchema,
  updateDataPlanSchema,
} from "../validations/dataPlan.validation";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";
import logger from "../utils/logger";

class DataPlanController {
  // Create a new data plan
  async createDataPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = validateSchema(createDataPlanSchema, req.body);

      const dataPlan = await dataPlanService.createDataPlan(validatedData);

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Data plan created successfully",
        data: {
          id: dataPlan._id,
          name: dataPlan.name,
          networkName: dataPlan.networkName,
          planType: dataPlan.planType,
          dataSize: dataPlan.dataSize,
          validityDays: dataPlan.validityDays,
          originalPrice: dataPlan.originalPrice,
          adminPrice: dataPlan.adminPrice,
          planId: dataPlan.planId,
          isActive: dataPlan.isActive,
          profit:
            dataPlan.adminPrice - (dataPlan.originalPrice || 0),
          createdAt: dataPlan.createdAt,
          updatedAt: dataPlan.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get data plans with filters and pagination
  async getDataPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        networkName,
        planType,
        isActive,
        page = 1,
        limit = 20,
      } = req.query;

      const filters: any = {};
      if (networkName) filters.networkName = networkName;
      if (planType) filters.planType = planType;
      if (isActive !== undefined) {
        filters.isActive = isActive === "true";
      }

      const result = await dataPlanService.getDataPlans(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      const formattedPlans = result.plans.map((plan) => ({
        id: plan._id,
        name: plan.name,
        networkName: plan.networkName,
        planType: plan.planType,
        dataSize: plan.dataSize,
        validityDays: plan.validityDays,
        originalPrice: plan.originalPrice || 0,
        adminPrice: plan.adminPrice,
        planId: plan.planId,
        isActive: plan.isActive,
        profit: plan.adminPrice - (plan.originalPrice || 0),
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      }));

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Data plans retrieved successfully",
        data: {
          plans: formattedPlans,
          pagination: {
            page: result.page,
            limit: parseInt(limit as string),
            total: result.total,
            pages: result.pages,
            hasNext: result.hasNext,
            hasPrev: result.hasPrev,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single data plan by ID
  async getDataPlanById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        throw new APIError("Data plan ID is required", HttpStatus.BAD_REQUEST);
      }

      const dataPlan = await dataPlanService.getDataPlanById(id);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Data plan retrieved successfully",
        data: {
          id: dataPlan._id,
          name: dataPlan.name,
          networkName: dataPlan.networkName,
          planType: dataPlan.planType,
          dataSize: dataPlan.dataSize,
          validityDays: dataPlan.validityDays,
          originalPrice: dataPlan.originalPrice || 0,
          adminPrice: dataPlan.adminPrice,
          planId: dataPlan.planId,
          isActive: dataPlan.isActive,
          profit: dataPlan.adminPrice - (dataPlan.originalPrice || 0),
          createdAt: dataPlan.createdAt,
          updatedAt: dataPlan.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Update data plan
  async updateDataPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = validateSchema(updateDataPlanSchema, req.body);

      if (!id) {
        throw new APIError("Data plan ID is required", HttpStatus.BAD_REQUEST);
      }

      const dataPlan = await dataPlanService.updateDataPlan(id, validatedData);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Data plan updated successfully",
        data: {
          id: dataPlan._id,
          name: dataPlan.name,
          networkName: dataPlan.networkName,
          planType: dataPlan.planType,
          dataSize: dataPlan.dataSize,
          validityDays: dataPlan.validityDays,
          originalPrice: dataPlan.originalPrice || 0,
          adminPrice: dataPlan.adminPrice,
          planId: dataPlan.planId,
          isActive: dataPlan.isActive,
          profit: dataPlan.adminPrice - (dataPlan.originalPrice || 0),
          createdAt: dataPlan.createdAt,
          updatedAt: dataPlan.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete data plan (soft delete)
  async deleteDataPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        throw new APIError("Data plan ID is required", HttpStatus.BAD_REQUEST);
      }

      await dataPlanService.deleteDataPlan(id);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Data plan deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Get plan types for a network
  async getPlanTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const { networkName } = req.params;
      const { networkName: queryNetworkName } = req.query;

      const network = networkName || (queryNetworkName as string);

      const planTypes = await dataPlanService.getPlanTypes(network);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Plan types retrieved successfully",
        data: planTypes,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get data plans by network and type
  async getDataPlansByNetworkAndType(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { networkName, planType } = req.params;
      const { page = 1, limit = 20 } = req.query;

      if (!networkName) {
        throw new APIError("Network name is required", HttpStatus.BAD_REQUEST);
      }

      if (!planType) {
        throw new APIError("Plan type is required", HttpStatus.BAD_REQUEST);
      }

      const result = await dataPlanService.getDataPlansByNetworkAndType(
        networkName,
        planType,
        parseInt(page as string),
        parseInt(limit as string)
      );

      const formattedPlans = result.plans.map((plan) => ({
        id: plan._id,
        name: plan.name,
        networkName: plan.networkName,
        planType: plan.planType,
        dataSize: plan.dataSize,
        validityDays: plan.validityDays,
        originalPrice: plan.originalPrice || 0,
        adminPrice: plan.adminPrice,
        planId: plan.planId,
        isActive: plan.isActive,
        profit: plan.adminPrice - (plan.originalPrice || 0),
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      }));

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Data plans retrieved successfully",
        data: {
          plans: formattedPlans,
          pagination: {
            page: result.page,
            limit: parseInt(limit as string),
            total: result.total,
            pages: result.pages,
            hasNext: result.hasNext,
            hasPrev: result.hasPrev,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DataPlanController();


import Joi from "joi";
import { isValidNetworkName } from "../utils/networkMapping";

export const createDataPlanSchema = Joi.object({
  name: Joi.string().required().trim().max(200),
  networkName: Joi.string()
    .required()
    .trim()
    .custom((value, helpers) => {
      if (!isValidNetworkName(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .messages({
      "any.invalid":
        "Network name must be one of: MTN, AIRTEL, GLO, 9MOBILE",
    }),
  planType: Joi.string().required().trim().max(100),
  dataSize: Joi.string()
    .required()
    .trim()
    .pattern(/^\d+(\.\d+)?\s*(GB|MB|gb|mb)$/i)
    .messages({
      "string.pattern.base":
        "Data size must be in format like '1GB', '500MB', '2.5GB'",
    }),
  validityDays: Joi.number().integer().min(1).required(),
  aychindodataId: Joi.number().integer().positive().required(),
  originalPrice: Joi.number().min(0).optional(),
  adminPrice: Joi.number().min(0).required(),
  planId: Joi.string().trim().optional(),
  isActive: Joi.boolean().optional(),
});

export const updateDataPlanSchema = Joi.object({
  name: Joi.string().trim().max(200).optional(),
  networkName: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (value && !isValidNetworkName(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .messages({
      "any.invalid":
        "Network name must be one of: MTN, AIRTEL, GLO, 9MOBILE",
    })
    .optional(),
  planType: Joi.string().trim().max(100).optional(),
  dataSize: Joi.string()
    .trim()
    .pattern(/^\d+(\.\d+)?\s*(GB|MB|gb|mb)$/i)
    .messages({
      "string.pattern.base":
        "Data size must be in format like '1GB', '500MB', '2.5GB'",
    })
    .optional(),
  validityDays: Joi.number().integer().min(1).optional(),
  aychindodataId: Joi.number().integer().positive().optional(),
  originalPrice: Joi.number().min(0).optional(),
  adminPrice: Joi.number().min(0).optional(),
  planId: Joi.string().trim().optional(),
  isActive: Joi.boolean().optional(),
});


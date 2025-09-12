import Joi from "joi";
import { HttpStatus } from "../constants/httpStatus.constant";
import APIError from "../error/APIError";
import { BankType } from "../constants/banks.constant";

// Create virtual account validation (PalmPay)
export const createVirtualAccountSchema = Joi.object({})
  .unknown(false)
  .messages({
    "object.unknown":
      "No fields are required. Virtual account will be created with hardcoded BVN.",
  });

// Upgrade KYC validation
export const upgradeKYCSchema = Joi.object({
  bvn: Joi.string()
    .pattern(/^\d{11}$/)
    .required()
    .messages({
      "string.pattern.base": "BVN must be exactly 11 digits",
      "any.required": "BVN is required",
    }),
})
  .unknown(false)
  .messages({
    "object.unknown":
      "Field '{#label}' is not allowed. Only bvn can be specified.",
  });

// Get transactions validation
export const getTransactionsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional().messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional()
    .messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be an integer",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 100",
    }),
})
  .unknown(false)
  .messages({
    "object.unknown":
      "Field '{#label}' is not allowed. Only page and limit can be specified.",
  });

// Virtual account search/filter validation
export const virtualAccountSearchSchema = Joi.object({
  bankId: Joi.string()
    .valid(...Object.values(BankType))
    .optional()
    .messages({
      "any.only": "Invalid bank ID filter",
    }),
  isActive: Joi.boolean().optional(),
  isKYCVerified: Joi.boolean().optional(),
  startDate: Joi.date().optional().messages({
    "date.base": "Start date must be a valid date",
  }),
  endDate: Joi.date().min(Joi.ref("startDate")).optional().messages({
    "date.base": "End date must be a valid date",
    "date.min": "End date must be after start date",
  }),
  page: Joi.number().integer().min(1).default(1).optional().messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional()
    .messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be an integer",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 100",
    }),
  sortBy: Joi.string()
    .valid("createdAt", "accountNumber", "bankName", "isKYCVerified")
    .default("createdAt")
    .optional()
    .messages({
      "any.only": "Invalid sort field",
    }),
  sortOrder: Joi.string()
    .valid("asc", "desc")
    .default("desc")
    .optional()
    .messages({
      "any.only": "Sort order must be either asc or desc",
    }),
});

// Transaction search/filter validation
export const transactionSearchSchema = Joi.object({
  type: Joi.string().valid("funding").optional().messages({
    "any.only": "Invalid transaction type",
  }),
  status: Joi.string()
    .valid("pending", "completed", "failed", "cancelled")
    .optional()
    .messages({
      "any.only": "Invalid transaction status",
    }),
  minAmount: Joi.number().min(0).optional().messages({
    "number.base": "Minimum amount must be a number",
    "number.min": "Minimum amount cannot be negative",
  }),
  maxAmount: Joi.number().min(0).optional().messages({
    "number.base": "Maximum amount must be a number",
    "number.min": "Maximum amount cannot be negative",
  }),
  startDate: Joi.date().optional().messages({
    "date.base": "Start date must be a valid date",
  }),
  endDate: Joi.date().min(Joi.ref("startDate")).optional().messages({
    "date.base": "End date must be a valid date",
    "date.min": "End date must be after start date",
  }),
  page: Joi.number().integer().min(1).default(1).optional().messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional()
    .messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be an integer",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 100",
    }),
  sortBy: Joi.string()
    .valid("createdAt", "amount", "type", "status")
    .default("createdAt")
    .optional()
    .messages({
      "any.only": "Invalid sort field",
    }),
  sortOrder: Joi.string()
    .valid("asc", "desc")
    .default("desc")
    .optional()
    .messages({
      "any.only": "Sort order must be either asc or desc",
    }),
});

// Virtual account statistics validation
export const virtualAccountStatsSchema = Joi.object({
  period: Joi.string()
    .valid("day", "week", "month", "year", "all")
    .default("month")
    .optional()
    .messages({
      "any.only": "Period must be day, week, month, year, or all",
    }),
  startDate: Joi.date()
    .when("period", {
      is: "all",
      then: Joi.optional(),
      otherwise: Joi.required(),
    })
    .messages({
      "any.required": "Start date is required when period is not all",
    }),
  endDate: Joi.date()
    .min(Joi.ref("startDate"))
    .when("period", {
      is: "all",
      then: Joi.optional(),
      otherwise: Joi.required(),
    })
    .messages({
      "any.required": "End date is required when period is not all",
      "date.min": "End date must be after start date",
    }),
  bankId: Joi.string()
    .valid(...Object.values(BankType))
    .optional()
    .messages({
      "any.only": "Invalid bank ID filter",
    }),
});

// Validation helper function
export const validateSchema = (schema: Joi.ObjectSchema, data: any) => {
  const { error, value } = schema.validate(data, { abortEarly: false });

  if (error) {
    const validationErrors = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    // Create a more descriptive main message
    const mainMessage =
      validationErrors.length === 1
        ? validationErrors[0]?.message || "Validation failed"
        : `Validation failed: ${validationErrors
            .map((e) => `${e.field} - ${e.message}`)
            .join(", ")}`;

    throw new APIError(mainMessage, HttpStatus.BAD_REQUEST, {
      validationErrors,
    });
  }

  return value;
};

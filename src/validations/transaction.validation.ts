import Joi from "joi";
import { HttpStatus } from "../constants/httpStatus.constant";
import APIError from "../error/APIError";

// Transaction search/filter validation
export const transactionSearchSchema = Joi.object({
  type: Joi.string().valid("funding", "airtime", "data").optional().messages({
    "any.only": "Type must be funding, airtime, or data",
  }),
  status: Joi.string()
    .valid("pending", "completed", "failed", "cancelled")
    .optional()
    .messages({
      "any.only": "Status must be pending, completed, failed, or cancelled",
    }),
  networkName: Joi.string()
    .valid("MTN", "AIRTEL", "GLO", "9MOBILE")
    .optional()
    .messages({
      "any.only": "Network must be MTN, AIRTEL, GLO, or 9MOBILE",
    }),
  phoneNumber: Joi.string()
    .pattern(/^0[789][01]\d{8}$/)
    .optional()
    .messages({
      "string.pattern.base":
        "Phone number must be in Nigerian format (e.g., 08123456789)",
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
    .default(20)
    .optional()
    .messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be an integer",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 100",
    }),
  sortBy: Joi.string()
    .valid("createdAt", "amount", "type", "status", "profit")
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

// Transaction statistics validation
export const transactionStatsSchema = Joi.object({
  startDate: Joi.date().optional().messages({
    "date.base": "Start date must be a valid date",
  }),
  endDate: Joi.date().min(Joi.ref("startDate")).optional().messages({
    "date.base": "End date must be a valid date",
    "date.min": "End date must be after start date",
  }),
});

// Transaction ID validation
export const transactionIdSchema = Joi.object({
  transactionId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Transaction ID must be a valid MongoDB ObjectId",
      "any.required": "Transaction ID is required",
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

import Joi from "joi";
import { HttpStatus } from "../constants/httpStatus.constant";
import APIError from "../error/APIError";

// User profile update validation
export const userProfileUpdateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional().messages({
    "string.min": "First name must be at least 2 characters long",
    "string.max": "First name cannot exceed 50 characters",
  }),
  lastName: Joi.string().min(2).max(50).optional().messages({
    "string.min": "Last name must be at least 2 characters long",
    "string.max": "Last name cannot exceed 50 characters",
  }),
  state: Joi.string().max(50).optional().allow(null, "").messages({
    "string.max": "State cannot exceed 50 characters",
  }),
})
  .unknown(false)
  .messages({
    "object.unknown":
      "Field '{#label}' is not allowed. Only firstName, lastName, and state can be updated.",
  });

// PIN validations (for user operations)
export const validatePinSchema = Joi.object({
  pin: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      "string.pattern.base": "PIN must be exactly 4 digits",
      "any.required": "PIN is required",
    }),
});

export const changePinSchema = Joi.object({
  currentPin: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      "string.pattern.base": "Current PIN must be exactly 4 digits",
      "any.required": "Current PIN is required",
    }),
  newPin: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      "string.pattern.base": "New PIN must be exactly 4 digits",
      "any.required": "New PIN is required",
    }),
});

// User wallet operations validation
export const walletOperationSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be positive",
    "number.precision": "Amount can have maximum 2 decimal places",
    "any.required": "Amount is required",
  }),
  description: Joi.string().max(200).optional().messages({
    "string.max": "Description cannot exceed 200 characters",
  }),
});

// User search/filter validation
export const userSearchSchema = Joi.object({
  search: Joi.string().min(2).max(100).optional().messages({
    "string.min": "Search term must be at least 2 characters long",
    "string.max": "Search term cannot exceed 100 characters",
  }),
  isActive: Joi.boolean().optional(),
  isEmailVerified: Joi.boolean().optional(),
  minWalletBalance: Joi.number().min(0).optional().messages({
    "number.min": "Minimum wallet balance cannot be negative",
  }),
  maxWalletBalance: Joi.number().min(0).optional().messages({
    "number.min": "Maximum wallet balance cannot be negative",
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
    .valid(
      "firstName",
      "lastName",
      "email",
      "phone",
      "wallet",
      "createdAt",
      "lastLoginAt"
    )
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

// User bulk operations validation
export const userBulkOperationSchema = Joi.object({
  userIds: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .max(100)
    .required()
    .messages({
      "array.base": "User IDs must be an array",
      "array.min": "At least one user ID is required",
      "array.max": "Cannot process more than 100 users at once",
      "any.required": "User IDs are required",
    }),
  operation: Joi.string()
    .valid("activate", "deactivate", "delete", "verifyEmail", "resetPin")
    .required()
    .messages({
      "any.only": "Invalid operation type",
      "any.required": "Operation type is required",
    }),
});

// User statistics validation
export const userStatsSchema = Joi.object({
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

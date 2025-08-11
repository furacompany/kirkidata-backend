import Joi from "joi";
import { HttpStatus } from "../constants/httpStatus.constant";
import APIError from "../error/APIError";

// Admin profile update validation
export const adminProfileUpdateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional().messages({
    "string.min": "First name must be at least 2 characters long",
    "string.max": "First name cannot exceed 50 characters",
  }),
  lastName: Joi.string().min(2).max(50).optional().messages({
    "string.min": "Last name must be at least 2 characters long",
    "string.max": "Last name cannot exceed 50 characters",
  }),
  phone: Joi.string()
    .pattern(/^[0-9]{11}$/)
    .optional()
    .messages({
      "string.pattern.base":
        "Phone number must be exactly 11 digits (e.g., 08123456789)",
    }),
  role: Joi.string().valid("admin", "super_admin").optional().messages({
    "any.only": "Role must be either admin or super_admin",
  }),
})
  .unknown(false)
  .messages({
    "object.unknown":
      "Field '{#label}' is not allowed. Only firstName, lastName, phone, and role can be updated.",
  });

// Admin password change validation
export const adminPasswordChangeSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "any.required": "Current password is required",
  }),
  newPassword: Joi.string().min(6).max(12).required().messages({
    "string.min": "New password must be at least 6 characters long",
    "string.max": "New password cannot exceed 12 characters",
    "any.required": "New password is required",
  }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Passwords do not match",
      "any.required": "Password confirmation is required",
    }),
});

// Admin search/filter validation
export const adminSearchSchema = Joi.object({
  search: Joi.string().min(2).max(100).optional().messages({
    "string.min": "Search term must be at least 2 characters long",
    "string.max": "Search term cannot exceed 100 characters",
  }),
  role: Joi.string().valid("admin", "super_admin").optional().messages({
    "any.only": "Invalid role filter",
  }),
  isActive: Joi.boolean().optional(),
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
    .valid("firstName", "lastName", "email", "role", "createdAt", "lastLoginAt")
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

// Admin bulk operations validation
export const adminBulkOperationSchema = Joi.object({
  adminIds: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .max(50)
    .required()
    .messages({
      "array.base": "Admin IDs must be an array",
      "array.min": "At least one admin ID is required",
      "array.max": "Cannot process more than 50 admins at once",
      "any.required": "Admin IDs are required",
    }),
  operation: Joi.string()
    .valid("activate", "deactivate", "changeRole", "resetPassword")
    .required()
    .messages({
      "any.only": "Invalid operation type",
      "any.required": "Operation type is required",
    }),
  newRole: Joi.string()
    .valid("admin", "super_admin")
    .when("operation", {
      is: "changeRole",
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    })
    .messages({
      "any.only": "Role must be either admin or super_admin",
      "any.required": "New role is required when changing role",
      "any.forbidden": "New role should not be provided for this operation",
    }),
});

// Admin statistics validation
export const adminStatsSchema = Joi.object({
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
  role: Joi.string().valid("admin", "super_admin").optional().messages({
    "any.only": "Invalid role filter",
  }),
});

// Admin activity log validation
export const adminActivityLogSchema = Joi.object({
  adminId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Invalid admin ID format",
    }),
  action: Joi.string()
    .valid(
      "login",
      "logout",
      "create",
      "update",
      "delete",
      "password_change",
      "role_change"
    )
    .optional()
    .messages({
      "any.only": "Invalid action type",
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

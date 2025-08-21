import Joi from "joi";
import { HttpStatus } from "../constants/httpStatus.constant";
import APIError from "../error/APIError";

// Airtime purchase validation
export const airtimePurchaseSchema = Joi.object({
  networkName: Joi.string()
    .valid("MTN", "AIRTEL", "GLO", "9MOBILE")
    .required()
    .messages({
      "any.only": "Network must be one of: MTN, AIRTEL, GLO, 9MOBILE",
      "any.required": "Network name is required",
    }),
  phoneNumber: Joi.string()
    .pattern(/^0[789][01]\d{8}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone number must be in Nigerian format (e.g., 08123456789)",
      "any.required": "Phone number is required",
    }),
  amount: Joi.number().integer().min(50).max(50000).required().messages({
    "number.base": "Amount must be a number",
    "number.integer": "Amount must be a whole number",
    "number.min": "Amount must be at least ₦50",
    "number.max": "Amount cannot exceed ₦50,000",
    "any.required": "Amount is required",
  }),
})
  .unknown(false)
  .messages({
    "object.unknown": "Field '{#label}' is not allowed",
  });

// Data purchase validation
export const dataPurchaseSchema = Joi.object({
  planId: Joi.string().required().messages({
    "any.required": "Plan ID is required",
    "string.empty": "Plan ID cannot be empty",
  }),
  phoneNumber: Joi.string()
    .pattern(/^0[789][01]\d{8}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone number must be in Nigerian format (e.g., 08123456789)",
      "any.required": "Phone number is required",
    }),
})
  .unknown(false)
  .messages({
    "object.unknown": "Field '{#label}' is not allowed",
  });

// Data plan pricing update validation
export const dataPlanPricingSchema = Joi.object({
  adminPrice: Joi.number().positive().required().messages({
    "number.base": "Admin price must be a number",
    "number.positive": "Admin price must be positive",
    "any.required": "Admin price is required",
  }),
})
  .unknown(false)
  .messages({
    "object.unknown": "Field '{#label}' is not allowed",
  });

// Airtime pricing update validation
export const airtimePricingSchema = Joi.object({
  adminPrice: Joi.number().min(0).required().messages({
    "number.base": "Admin price must be a number",
    "number.min": "Admin price cannot be negative",
    "any.required": "Admin price is required",
  }),
})
  .unknown(false)
  .messages({
    "object.unknown": "Field '{#label}' is not allowed",
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

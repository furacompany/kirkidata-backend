import Joi from "joi";
import { HttpStatus } from "../constants/httpStatus.constant";
import APIError from "../error/APIError";

// User registration validation
export const userRegistrationSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().messages({
    "string.min": "First name must be at least 2 characters long",
    "string.max": "First name cannot exceed 50 characters",
    "any.required": "First name is required",
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    "string.min": "Last name must be at least 2 characters long",
    "string.max": "Last name cannot exceed 50 characters",
    "any.required": "Last name is required",
  }),
  phone: Joi.string()
    .pattern(/^[0-9]{11}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone number must be exactly 11 digits (e.g., 08123456789)",
      "any.required": "Phone number is required",
    }),
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string()
    .min(6)
    .max(12)
    .pattern(/^[A-Za-z0-9@$!%*?&]+$/)
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters long",
      "string.max": "Password cannot exceed 12 characters",
      "string.pattern.base":
        "Password can contain letters, numbers, and special characters (@$!%*?&)",
      "any.required": "Password is required",
    }),
  pin: Joi.string()
    .length(4)
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      "string.length": "PIN must be exactly 4 digits",
      "string.pattern.base": "PIN must contain only digits",
      "any.required": "PIN is required",
    }),
});

// User login validation
export const userLoginSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[0-9]{11}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone number must be exactly 11 digits (e.g., 08123456789)",
      "any.required": "Phone number is required",
    }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

// Admin registration validation
export const adminRegistrationSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().messages({
    "string.min": "First name must be at least 2 characters long",
    "string.max": "First name cannot exceed 50 characters",
    "any.required": "First name is required",
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    "string.min": "Last name must be at least 2 characters long",
    "string.max": "Last name cannot exceed 50 characters",
    "any.required": "Last name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
  phone: Joi.string()
    .pattern(/^[0-9]{11}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone number must be exactly 11 digits (e.g., 08123456789)",
      "any.required": "Phone number is required",
    }),
  password: Joi.string().min(6).max(12).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "string.max": "Password cannot exceed 12 characters",
    "any.required": "Password is required",
  }),
  role: Joi.string().valid("admin", "super_admin").default("admin").messages({
    "any.only": "Role must be either admin or super_admin",
  }),
});

// Admin login validation
export const adminLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

// Password reset request validation
export const passwordResetRequestSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
});

// Password reset validation
export const passwordResetSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Reset token is required",
  }),
  newPassword: Joi.string().min(8).max(128).required().messages({
    "string.min": "Password must be at least 8 characters long",
    "string.max": "Password cannot exceed 128 characters",
    "any.required": "New password is required",
  }),
});

// PIN validation
export const pinValidationSchema = Joi.object({
  pin: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      "string.pattern.base": "PIN must be exactly 4 digits",
      "any.required": "PIN is required",
    }),
});

// PIN change validation
export const pinChangeSchema = Joi.object({
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

// Email verification validation
export const emailVerificationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
  otp: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.length": "OTP must be exactly 6 digits",
      "string.pattern.base": "OTP must contain only digits",
      "any.required": "OTP is required",
    }),
});

// Resend email verification validation
export const resendEmailVerificationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
});

// Refresh token validation
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    "any.required": "Refresh token is required",
  }),
  role: Joi.string().valid("user", "admin", "super_admin").required().messages({
    "any.only": "Role must be user, admin, or super_admin",
    "any.required": "Role is required",
  }),
});

// Forgot password validation
export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
});

// Reset password validation
export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
  otp: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.length": "OTP must be exactly 6 digits",
      "string.pattern.base": "OTP must contain only digits",
      "any.required": "OTP is required",
    }),
  newPassword: Joi.string()
    .min(6)
    .max(12)
    .pattern(/^[A-Za-z0-9@$!%*?&]+$/)
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters long",
      "string.max": "Password cannot exceed 12 characters",
      "string.pattern.base":
        "Password can contain letters, numbers, and special characters (@$!%*?&)",
      "any.required": "New password is required",
    }),
});

// Change password validation (for authenticated users)
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "any.required": "Current password is required",
  }),
  newPassword: Joi.string()
    .min(6)
    .max(12)
    .pattern(/^[A-Za-z0-9@$!%*?&]+$/)
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters long",
      "string.max": "Password cannot exceed 12 characters",
      "string.pattern.base":
        "Password can contain letters, numbers, and special characters (@$!%*?&)",
      "any.required": "New password is required",
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

    throw new APIError("Validation failed", HttpStatus.BAD_REQUEST, {
      validationErrors,
    });
  }

  return value;
};

// Validation functions
export const validateUserRegistration = (data: any) => {
  return userRegistrationSchema.validate(data);
};

export const validateUserLogin = (data: any) => {
  return userLoginSchema.validate(data);
};

export const validateAdminLogin = (data: any) => {
  return adminLoginSchema.validate(data);
};

export const validateRefreshToken = (data: any) => {
  return refreshTokenSchema.validate(data);
};

export const validateForgotPassword = (data: any) => {
  return forgotPasswordSchema.validate(data);
};

export const validateResetPassword = (data: any) => {
  return resetPasswordSchema.validate(data);
};

export const validateChangePassword = (data: any) => {
  return changePasswordSchema.validate(data);
};

export const validateEmailVerification = (data: any) => {
  return emailVerificationSchema.validate(data);
};

export const validateResendEmailVerification = (data: any) => {
  return resendEmailVerificationSchema.validate(data);
};

export const validateAdminRegistration = (data: any) => {
  return adminRegistrationSchema.validate(data);
};

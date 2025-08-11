import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { Request } from "express";

export interface JWTPayload {
  id: string;
  email: string;
  phone?: string;
  role: "user" | "admin" | "super_admin";
  type: "access" | "refresh" | "email_verification" | "password_reset";
}

export interface JWTAdminPayload {
  id: string;
  email: string;
  phone: string;
  role: "admin" | "super_admin";
  type: "access" | "refresh";
}

// JWT Secret Keys
export const JWT_SECRET: Secret =
  process.env.JWT_SECRET ||
  "your-super-secret-jwt-key-change-this-in-production-minimum-64-characters-long";
export const JWT_REFRESH_SECRET: Secret =
  process.env.JWT_REFRESH_SECRET ||
  "your-super-secret-refresh-jwt-key-change-this-in-production-minimum-64-characters-long";

// JWT Expiry Times - properly typed as StringValue
export const JWT_ACCESS_TOKEN_EXPIRY = "1d" as const;
export const JWT_REFRESH_TOKEN_EXPIRY = "7d" as const;
export const JWT_ADMIN_ACCESS_TOKEN_EXPIRY = "30m" as const;
export const JWT_ADMIN_REFRESH_TOKEN_EXPIRY = "1d" as const;
export const JWT_EMAIL_VERIFICATION_EXPIRY = "24h" as const;
export const JWT_PASSWORD_RESET_EXPIRY = "1h" as const;

// JWT Options for different token types
export const JWT_ACCESS_TOKEN_OPTIONS: SignOptions = {
  expiresIn: JWT_ACCESS_TOKEN_EXPIRY,
  issuer: "kirkidata",
  audience: "users",
  noTimestamp: false, // Ensure iat claim is included
};

export const JWT_REFRESH_TOKEN_OPTIONS: SignOptions = {
  expiresIn: JWT_REFRESH_TOKEN_EXPIRY,
  issuer: "kirkidata",
  audience: "users",
  noTimestamp: false, // Ensure iat claim is included
};

export const JWT_ADMIN_ACCESS_TOKEN_OPTIONS: SignOptions = {
  expiresIn: JWT_ADMIN_ACCESS_TOKEN_EXPIRY,
  issuer: "kirkidata",
  audience: "admins",
  noTimestamp: false, // Ensure iat claim is included
};

export const JWT_ADMIN_REFRESH_TOKEN_OPTIONS: SignOptions = {
  expiresIn: JWT_ADMIN_REFRESH_TOKEN_EXPIRY,
  issuer: "kirkidata",
  audience: "admins",
  noTimestamp: false, // Ensure iat claim is included
};

export const JWT_EMAIL_VERIFICATION_OPTIONS: SignOptions = {
  expiresIn: JWT_EMAIL_VERIFICATION_EXPIRY,
  issuer: "kirkidata",
  audience: "email_verification",
  noTimestamp: false, // Ensure iat claim is included
};

export const JWT_PASSWORD_RESET_OPTIONS: SignOptions = {
  expiresIn: JWT_PASSWORD_RESET_EXPIRY,
  issuer: "kirkidata",
  audience: "password_reset",
  noTimestamp: false, // Ensure iat claim is included
};

// JWT Token Generation Functions
export const generateAccessToken = (
  payload: Omit<JWTPayload, "type">
): string => {
  const signOptions: SignOptions = {
    expiresIn: JWT_ACCESS_TOKEN_EXPIRY,
  };
  return jwt.sign({ ...payload, type: "access" }, JWT_SECRET, signOptions);
};

export const generateRefreshToken = (
  payload: Omit<JWTPayload, "type">
): string => {
  const signOptions: SignOptions = {
    expiresIn: JWT_REFRESH_TOKEN_EXPIRY,
  };
  return jwt.sign(
    { ...payload, type: "refresh" },
    JWT_REFRESH_SECRET,
    signOptions
  );
};

export const generateAdminAccessToken = (
  payload: Omit<JWTAdminPayload, "type">
): string => {
  const signOptions: SignOptions = {
    expiresIn: JWT_ADMIN_ACCESS_TOKEN_EXPIRY,
  };
  return jwt.sign({ ...payload, type: "access" }, JWT_SECRET, signOptions);
};

export const generateAdminRefreshToken = (
  payload: Omit<JWTAdminPayload, "type">
): string => {
  const signOptions: SignOptions = {
    expiresIn: JWT_ADMIN_REFRESH_TOKEN_EXPIRY,
  };
  return jwt.sign(
    { ...payload, type: "refresh" },
    JWT_REFRESH_SECRET,
    signOptions
  );
};

export const generateEmailVerificationToken = (
  payload: Omit<JWTPayload, "type">
): string => {
  const signOptions: SignOptions = {
    expiresIn: JWT_EMAIL_VERIFICATION_EXPIRY,
  };
  return jwt.sign(
    { ...payload, type: "email_verification" },
    JWT_SECRET,
    signOptions
  );
};

export const generatePasswordResetToken = (
  payload: Omit<JWTPayload, "type">
): string => {
  const signOptions: SignOptions = {
    expiresIn: JWT_PASSWORD_RESET_EXPIRY,
  };
  return jwt.sign(
    { ...payload, type: "password_reset" },
    JWT_SECRET,
    signOptions
  );
};

// JWT Token Verification Functions
export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
};

export const verifyAdminAccessToken = (token: string): JWTAdminPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTAdminPayload;
};

export const verifyAdminRefreshToken = (token: string): JWTAdminPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JWTAdminPayload;
};

// Extract token from request
export const extractTokenFromRequest = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
};

// Check if token is invalidated by logout time
export const isTokenInvalidatedByLogout = (
  tokenPayload: any,
  lastLogoutAt?: Date
): boolean => {
  if (!lastLogoutAt) {
    return false; // No logout recorded, token is valid
  }

  // Convert iat (issued at) from seconds to Date
  const tokenIssuedAt = new Date(tokenPayload.iat * 1000);

  // If token was issued before last logout, it's invalid
  return tokenIssuedAt < lastLogoutAt;
};

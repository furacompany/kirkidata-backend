import { ParsedQs } from "qs";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";

/**
 * Type for Express query/params values
 */
type ExpressParamValue = string | ParsedQs | (string | ParsedQs)[] | undefined;

/**
 * Safely extracts a string value from req.params or req.query
 * Handles Express types including ParsedQs
 * @param value - The value from req.params or req.query
 * @returns The string value, or undefined if not found
 */
export function getStringParam(value: ExpressParamValue): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (Array.isArray(value)) {
    const firstValue = value[0];
    if (typeof firstValue === "string") {
      return firstValue;
    }
    if (firstValue && typeof firstValue === "object") {
      return String(firstValue);
    }
    return undefined;
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object") {
    return String(value);
  }
  return undefined;
}

/**
 * Safely extracts a required string value from req.params or req.query
 * Throws an APIError if the value is missing
 * @param value - The value from req.params or req.query
 * @param paramName - The name of the parameter (for error message)
 * @returns The string value
 */
export function getRequiredStringParam(
  value: ExpressParamValue,
  paramName: string
): string {
  const stringValue = getStringParam(value);
  if (!stringValue) {
    throw new APIError(`${paramName} is required`, HttpStatus.BAD_REQUEST);
  }
  return stringValue;
}

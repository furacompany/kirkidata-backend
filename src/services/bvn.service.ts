import logger from "../utils/logger";

interface BVNVerificationParams {
  firstName: string;
  lastName: string;
  middleName?: string;
  phoneNumber?: string;
}

interface BVNVerificationResult {
  success: boolean;
  data: {
    nameMatchRlt: string;
    namesMatchPercentage: number;
    phoneNumberMatchRlt: string;
  };
}

/**
 * Mock BVN verification service
 * In production, this would integrate with a real BVN verification service
 */
export async function verifyBVN({
  firstName,
  lastName,
  middleName,
  phoneNumber,
}: BVNVerificationParams): Promise<BVNVerificationResult> {
  try {
    logger.info("Mock BVN verification started:", {
      firstName,
      lastName,
      middleName,
      phoneNumber,
    });

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock: always return success for now
    // In production, this would call a real BVN verification API
    const result: BVNVerificationResult = {
      success: true,
      data: {
        nameMatchRlt: "Exactly Match",
        namesMatchPercentage: 100,
        phoneNumberMatchRlt: "Exactly Match",
      },
    };

    logger.info("Mock BVN verification completed:", {
      success: result.success,
      nameMatch: result.data.nameMatchRlt,
      phoneMatch: result.data.phoneNumberMatchRlt,
    });

    return result;
  } catch (error) {
    logger.error("Mock BVN verification failed:", error);

    // Return failure result
    return {
      success: false,
      data: {
        nameMatchRlt: "No Match",
        namesMatchPercentage: 0,
        phoneNumberMatchRlt: "No Match",
      },
    };
  }
}

/**
 * Validate BVN format (basic validation)
 * @param bvn - BVN to validate
 * @returns boolean indicating if BVN format is valid
 */
export function validateBVNFormat(bvn: string): boolean {
  // Nigerian BVN is 11 digits
  const bvnRegex = /^\d{11}$/;
  return bvnRegex.test(bvn);
}

/**
 * Validate NIN format (basic validation)
 * @param nin - NIN to validate
 * @returns boolean indicating if NIN format is valid
 */
export function validateNINFormat(nin: string): boolean {
  // Nigerian NIN is 11 digits
  const ninRegex = /^\d{11}$/;
  return ninRegex.test(nin);
}

/**
 * Validate CAC format (basic validation)
 * @param cac - CAC to validate
 * @returns boolean indicating if CAC format is valid
 */
export function validateCACFormat(cac: string): boolean {
  // Nigerian CAC starts with RC or BN followed by digits
  const cacRegex = /^(RC|BN)\d+$/;
  return cacRegex.test(cac);
}

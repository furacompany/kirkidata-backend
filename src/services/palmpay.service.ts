import axios from "axios";
import { sign, getPalmPayPrivateKey } from "../utils/palmpay";
import logger from "../utils/logger";
import APIError from "../error/APIError";
import { HttpStatus } from "../constants/httpStatus.constant";

interface CreateVirtualAccountParams {
  virtualAccountName: string;
  identityType: "personal" | "personal_nin" | "company";
  licenseNumber: string;
  customerName: string;
  email?: string;
  accountReference?: string;
}

interface UpdateVirtualAccountStatusParams {
  virtualAccountNo: string;
  status: "Enabled" | "Disabled";
}

interface DeleteVirtualAccountParams {
  virtualAccountNo: string;
}

interface QueryVirtualAccountParams {
  virtualAccountNo: string;
}

interface QuerySingleOrderParams {
  orderNo: string;
}

interface BulkQueryOrdersParams {
  accountNo?: string;
  startTime: number;
  endTime: number;
  pageIndex?: number;
  pageSize?: number;
}

// Base PalmPay API URL
const PALMPAY_BASE_URL = "https://open-gw-prod.palmpay-inc.com";

export async function createVirtualAccount({
  virtualAccountName,
  identityType,
  licenseNumber,
  customerName,
  email,
  accountReference,
}: CreateVirtualAccountParams): Promise<any> {
  const PALMPAY_COUNTRY_CODE = process.env.PALMPAY_COUNTRY_CODE as string;
  const PALMPAY_APP_ID = process.env.PALMPAY_APP_ID as string;

  if (!PALMPAY_COUNTRY_CODE) {
    throw new APIError(
      "PALMPAY_COUNTRY_CODE environment variable is required",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  if (!PALMPAY_APP_ID) {
    throw new APIError(
      "PALMPAY_APP_ID environment variable is required",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  // Generate nonce and requestTime
  const nonceStr = Math.random().toString(36).substring(2, 18);
  const requestTime = Date.now();

  // Create payload in the exact format PalmPay expects
  const payload: any = {
    requestTime,
    identityType,
    licenseNumber,
    virtualAccountName,
    version: "V2.0",
    customerName,
    email,
    nonceStr,
  };
  if (accountReference) payload.accountReference = accountReference;

  try {
    logger.info("Creating PalmPay virtual account:", {
      virtualAccountName,
      identityType,
      customerName,
      accountReference,
    });

    // Get private key for signing
    const privateKey = getPalmPayPrivateKey();

    // Generate signature using PalmPay SDK
    const signature = sign(payload, privateKey);

    const response = await axios.post(
      `${PALMPAY_BASE_URL}/api/v2/virtual/account/label/create`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${PALMPAY_APP_ID}`,
          countryCode: PALMPAY_COUNTRY_CODE,
          Signature: signature,
          "Content-Type": "application/json;charset=UTF-8",
        },
        timeout: 30000,
      }
    );

    logger.info("PalmPay virtual account created successfully:", {
      virtualAccountNo: response.data.data?.virtualAccountNo,
      status: response.data.data?.status,
    });

    return response.data;
  } catch (error: any) {
    logger.error("PalmPay virtual account creation failed:", {
      error: error.message,
      response: error.response?.data,
      virtualAccountName,
      identityType,
    });

    if (error.response) {
      throw new APIError(
        `PalmPay API error: ${JSON.stringify(error.response.data)}`,
        HttpStatus.BAD_REQUEST
      );
    }
    throw error;
  }
}

export async function updateVirtualAccountStatus({
  virtualAccountNo,
  status,
}: UpdateVirtualAccountStatusParams): Promise<any> {
  const PALMPAY_COUNTRY_CODE = process.env.PALMPAY_COUNTRY_CODE as string;
  const PALMPAY_APP_ID = process.env.PALMPAY_APP_ID as string;

  if (!PALMPAY_COUNTRY_CODE) {
    throw new APIError(
      "PALMPAY_COUNTRY_CODE environment variable is required",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  if (!PALMPAY_APP_ID) {
    throw new APIError(
      "PALMPAY_APP_ID environment variable is required",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  // Generate nonce and requestTime
  const nonceStr = Math.random().toString(36).substring(2, 18);
  const requestTime = Date.now();

  // Create payload for updating virtual account status
  const payload: any = {
    requestTime,
    version: "V2.0",
    nonceStr,
    virtualAccountNo,
    status,
  };

  try {
    logger.info("Updating PalmPay virtual account status:", {
      virtualAccountNo,
      status,
    });

    // Get private key for signing
    const privateKey = getPalmPayPrivateKey();

    // Generate signature using PalmPay SDK
    const signature = sign(payload, privateKey);

    const response = await axios.post(
      `${PALMPAY_BASE_URL}/api/v2/virtual/account/label/update`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${PALMPAY_APP_ID}`,
          countryCode: PALMPAY_COUNTRY_CODE,
          Signature: signature,
          "Content-Type": "application/json;charset=UTF-8",
        },
        timeout: 30000,
      }
    );

    logger.info("PalmPay virtual account status updated successfully:", {
      virtualAccountNo,
      status,
      respCode: response.data.respCode,
    });

    return response.data;
  } catch (error: any) {
    logger.error("PalmPay virtual account status update failed:", {
      error: error.message,
      response: error.response?.data,
      virtualAccountNo,
      status,
    });

    if (error.response) {
      throw new APIError(
        `PalmPay status update error: ${JSON.stringify(error.response.data)}`,
        HttpStatus.BAD_REQUEST
      );
    }
    throw error;
  }
}

export async function deleteVirtualAccount({
  virtualAccountNo,
}: DeleteVirtualAccountParams): Promise<any> {
  const PALMPAY_COUNTRY_CODE = process.env.PALMPAY_COUNTRY_CODE as string;
  const PALMPAY_APP_ID = process.env.PALMPAY_APP_ID as string;

  if (!PALMPAY_COUNTRY_CODE) {
    throw new APIError(
      "PALMPAY_COUNTRY_CODE environment variable is required",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  if (!PALMPAY_APP_ID) {
    throw new APIError(
      "PALMPAY_APP_ID environment variable is required",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  // Generate nonce and requestTime
  const nonceStr = Math.random().toString(36).substring(2, 18);
  const requestTime = Date.now();

  // Create payload for deleting virtual account
  const payload: any = {
    requestTime,
    version: "V2.0",
    nonceStr,
    virtualAccountNo,
  };

  try {
    logger.info("Deleting PalmPay virtual account:", {
      virtualAccountNo,
    });

    // Get private key for signing
    const privateKey = getPalmPayPrivateKey();

    // Generate signature using PalmPay SDK
    const signature = sign(payload, privateKey);

    const response = await axios.post(
      `${PALMPAY_BASE_URL}/api/v2/virtual/account/label/delete`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${PALMPAY_APP_ID}`,
          countryCode: PALMPAY_COUNTRY_CODE,
          Signature: signature,
          "Content-Type": "application/json;charset=UTF-8",
        },
        timeout: 30000,
      }
    );

    logger.info("PalmPay virtual account deleted successfully:", {
      virtualAccountNo,
      respCode: response.data.respCode,
    });

    return response.data;
  } catch (error: any) {
    logger.error("PalmPay virtual account deletion failed:", {
      error: error.message,
      response: error.response?.data,
      virtualAccountNo,
    });

    if (error.response) {
      throw new APIError(
        `PalmPay delete error: ${JSON.stringify(error.response.data)}`,
        HttpStatus.BAD_REQUEST
      );
    }
    throw error;
  }
}

export async function queryVirtualAccount({
  virtualAccountNo,
}: QueryVirtualAccountParams): Promise<any> {
  const PALMPAY_COUNTRY_CODE = process.env.PALMPAY_COUNTRY_CODE as string;
  const PALMPAY_APP_ID = process.env.PALMPAY_APP_ID as string;

  if (!PALMPAY_COUNTRY_CODE) {
    throw new APIError(
      "PALMPAY_COUNTRY_CODE environment variable is required",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  if (!PALMPAY_APP_ID) {
    throw new APIError(
      "PALMPAY_APP_ID environment variable is required",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  // Generate nonce and requestTime
  const nonceStr = Math.random().toString(36).substring(2, 18);
  const requestTime = Date.now();

  // Create payload for querying virtual account
  const payload: any = {
    requestTime,
    version: "V2.0",
    nonceStr,
    virtualAccountNo,
  };

  try {
    logger.info("Querying PalmPay virtual account:", {
      virtualAccountNo,
    });

    // Get private key for signing
    const privateKey = getPalmPayPrivateKey();

    // Generate signature using PalmPay SDK
    const signature = sign(payload, privateKey);

    const response = await axios.post(
      `${PALMPAY_BASE_URL}/api/v2/virtual/account/label/queryOne`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${PALMPAY_APP_ID}`,
          countryCode: PALMPAY_COUNTRY_CODE,
          Signature: signature,
          "Content-Type": "application/json;charset=UTF-8",
        },
        timeout: 30000,
      }
    );

    logger.info("PalmPay virtual account queried successfully:", {
      virtualAccountNo,
      respCode: response.data.respCode,
    });

    return response.data;
  } catch (error: any) {
    logger.error("PalmPay virtual account query failed:", {
      error: error.message,
      response: error.response?.data,
      virtualAccountNo,
    });

    if (error.response) {
      throw new APIError(
        `PalmPay query error: ${JSON.stringify(error.response.data)}`,
        HttpStatus.BAD_REQUEST
      );
    }
    throw error;
  }
}

export async function querySingleOrder({
  orderNo,
}: QuerySingleOrderParams): Promise<any> {
  const PALMPAY_COUNTRY_CODE = process.env.PALMPAY_COUNTRY_CODE as string;
  const PALMPAY_APP_ID = process.env.PALMPAY_APP_ID as string;

  if (!PALMPAY_COUNTRY_CODE) {
    throw new APIError(
      "PALMPAY_COUNTRY_CODE environment variable is required",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  if (!PALMPAY_APP_ID) {
    throw new APIError(
      "PALMPAY_APP_ID environment variable is required",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  // Generate nonce and requestTime
  const nonceStr = Math.random().toString(36).substring(2, 18);
  const requestTime = Date.now();

  // Create payload for querying single order
  const payload: any = {
    requestTime,
    version: "V2.0",
    nonceStr,
    orderNo,
  };

  try {
    logger.info("Querying PalmPay single order:", {
      orderNo,
    });

    // Get private key for signing
    const privateKey = getPalmPayPrivateKey();

    // Generate signature using PalmPay SDK
    const signature = sign(payload, privateKey);

    const response = await axios.post(
      `${PALMPAY_BASE_URL}/api/v2/virtual/order/detail`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${PALMPAY_APP_ID}`,
          countryCode: PALMPAY_COUNTRY_CODE,
          Signature: signature,
          "Content-Type": "application/json;charset=UTF-8",
        },
        timeout: 30000,
      }
    );

    logger.info("PalmPay single order queried successfully:", {
      orderNo,
      respCode: response.data.respCode,
    });

    return response.data;
  } catch (error: any) {
    logger.error("PalmPay single order query failed:", {
      error: error.message,
      response: error.response?.data,
      orderNo,
    });

    if (error.response) {
      throw new APIError(
        `PalmPay single order query error: ${JSON.stringify(
          error.response.data
        )}`,
        HttpStatus.BAD_REQUEST
      );
    }
    throw error;
  }
}

export async function bulkQueryOrders({
  accountNo,
  startTime,
  endTime,
  pageIndex = 1,
  pageSize = 50,
}: BulkQueryOrdersParams): Promise<any> {
  const PALMPAY_COUNTRY_CODE = process.env.PALMPAY_COUNTRY_CODE as string;
  const PALMPAY_APP_ID = process.env.PALMPAY_APP_ID as string;

  if (!PALMPAY_COUNTRY_CODE) {
    throw new APIError(
      "PALMPAY_COUNTRY_CODE environment variable is required",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  if (!PALMPAY_APP_ID) {
    throw new APIError(
      "PALMPAY_APP_ID environment variable is required",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  // Generate nonce and requestTime
  const nonceStr = Math.random().toString(36).substring(2, 18);
  const requestTime = Date.now();

  // Create payload for bulk querying orders
  const payload: any = {
    requestTime,
    version: "V2.0",
    nonceStr,
    startTime,
    endTime,
    pageIndex,
    pageSize,
  };
  if (accountNo) payload.accountNo = accountNo;

  try {
    logger.info("Querying PalmPay bulk orders:", {
      accountNo,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      pageIndex,
      pageSize,
    });

    // Get private key for signing
    const privateKey = getPalmPayPrivateKey();

    // Generate signature using PalmPay SDK
    const signature = sign(payload, privateKey);

    const response = await axios.post(
      `${PALMPAY_BASE_URL}/api/v2/virtual/order/pageList`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${PALMPAY_APP_ID}`,
          countryCode: PALMPAY_COUNTRY_CODE,
          Signature: signature,
          "Content-Type": "application/json;charset=UTF-8",
        },
        timeout: 30000,
      }
    );

    logger.info("PalmPay bulk orders queried successfully:", {
      accountNo,
      respCode: response.data.respCode,
      totalCount: response.data.data?.totalCount,
    });

    return response.data;
  } catch (error: any) {
    logger.error("PalmPay bulk orders query failed:", {
      error: error.message,
      response: error.response?.data,
      accountNo,
    });

    if (error.response) {
      throw new APIError(
        `PalmPay bulk order query error: ${JSON.stringify(
          error.response.data
        )}`,
        HttpStatus.BAD_REQUEST
      );
    }
    throw error;
  }
}

// PalmPay SDK utilities for OtoBill backend
const {
  sign,
  rsaVerify,
  sortParams,
  HashMap,
} = require("./signatureGeneration");
const { verifyPalmPayWebhook } = require("./signatureVerification");
const {
  getPalmPayPrivateKey,
  getPalmPayPublicKeyForUpload,
  getPalmPayPublicKey,
} = require("./keyUtils");

module.exports = {
  // Signature generation
  sign,
  rsaVerify,
  sortParams,
  HashMap,

  // Signature verification
  verifyPalmPayWebhook,

  // Key utilities
  getPalmPayPrivateKey,
  getPalmPayPublicKeyForUpload,
  getPalmPayPublicKey,
};

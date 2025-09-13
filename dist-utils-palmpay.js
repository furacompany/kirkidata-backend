// PalmPay SDK utilities for KirkiData backend
const {
  sign,
  rsaVerify,
  sortParams,
  HashMap,
} = require("./palmpay/signatureGeneration");
const { verifyPalmPayWebhook } = require("./palmpay/signatureVerification");
const {
  getPalmPayPrivateKey,
  getPalmPayPublicKeyForUpload,
  getPalmPayPublicKey,
} = require("./palmpay/keyUtils");

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

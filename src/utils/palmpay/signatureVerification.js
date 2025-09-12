const md5 = require("md5");
const { KJUR, b64tohex } = require("jsrsasign");

const HashMap = {
  SHA256withRSA: "SHA256withRSA",
  SHA1withRSA: "SHA1withRSA",
};

const PEM_BEGIN_PUBLIC = "-----BEGIN PUBLIC KEY-----\n";
const PEM_END_PUBLIC = "\n-----END PUBLIC KEY-----";

/**
 * Sorts the parameters and returns them as a query string
 * @param {Object} params - The parameters to be sorted and concatenated
 * @returns {string} - The sorted parameters as a query string
 */
function sortParams(params) {
  const sortedParams = Object.keys(params)
    .sort()
    .filter((item) => item !== "sign" && typeof params[item] !== "undefined")
    .map((item) => `${item}=${params[item]}`)
    .join("&");
  console.log("📝 Sorted Params:", sortedParams);
  return sortedParams;
}

/**
 * Formats the public key by adding PEM headers and footers if they are missing
 * @param {string} key - The public key to be formatted
 * @returns {string} - The formatted public key
 */
function formatKey(key) {
  if (!key.startsWith(PEM_BEGIN_PUBLIC)) {
    key = PEM_BEGIN_PUBLIC + key;
  }
  if (!key.endsWith(PEM_END_PUBLIC)) {
    key = key + PEM_END_PUBLIC;
  }
  return key;
}

/**
 * Verifies the RSA signature using the jsrsasign library
 * @param {string} data - The data to be verified
 * @param {string} signature - The signature to be verified
 * @param {string} publicKey - The public key used for verification
 * @param {string} hashAlgorithm - The hash algorithm used (e.g., SHA1withRSA, SHA256withRSA)
 * @returns {boolean} - Returns true if the signature is valid, false otherwise
 */
function rsaVerify(data, signature, publicKey, hashAlgorithm) {
  const formattedPublicKey = formatKey(publicKey);

  const sig = new KJUR.crypto.Signature({
    alg: hashAlgorithm,
  });
  sig.init(formattedPublicKey);
  sig.updateString(data);
  return sig.verify(b64tohex(signature));
}

/**
 * Verify PalmPay webhook signature
 * @param {Object} notifyData - The notification data from PalmPay
 * @param {string} publicKey - PalmPay's public key
 * @returns {boolean} - Returns true if signature is valid
 */
function verifyPalmPayWebhook(notifyData, publicKey) {
  const signature = decodeURIComponent(notifyData.sign);
  const messageDigest = md5(sortParams(notifyData)).toUpperCase();

  console.log("🔐 MD5 hash:", messageDigest);
  console.log("✍️ Signature:", signature);

  return rsaVerify(messageDigest, signature, publicKey, HashMap.SHA1withRSA);
}

module.exports = {
  rsaVerify,
  sortParams,
  verifyPalmPayWebhook,
  HashMap,
};

const fs = require("fs");
const path = require("path");

/**
 * Read and format private key for PalmPay SDK
 * @param {string} keyPath - Path to the private key file
 * @returns {string} - Formatted private key string
 */
function getPalmPayPrivateKey(keyPath = null) {
  try {
    // Use provided path or default to keys directory
    const defaultPath = path.join(
      __dirname,
      "..",
      "..",
      "keys",
      "private_key.pem"
    );
    const privateKeyPath =
      keyPath || process.env.PALMPAY_PRIVATE_KEY_PATH || defaultPath;

    console.log("🔍 Looking for private key at:", privateKeyPath);

    if (!fs.existsSync(privateKeyPath)) {
      throw new Error(
        `Private key file not found: ${privateKeyPath}\nPlease ensure your private key is saved as 'keys/private_key.pem'`
      );
    }

    let privateKey = fs.readFileSync(privateKeyPath, "utf8");

    // Remove PEM headers and footers, and all whitespace
    privateKey = privateKey
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .replace("-----BEGIN RSA PRIVATE KEY-----", "")
      .replace("-----END RSA PRIVATE KEY-----", "")
      .replace(/\n/g, "")
      .replace(/\r/g, "")
      .replace(/\s+/g, "");

    console.log("✅ Private key loaded and formatted successfully");
    return privateKey;
  } catch (error) {
    console.error("❌ Error loading private key:", error.message);
    throw error;
  }
}

/**
 * Format public key for PalmPay dashboard upload
 * @param {string} publicKeyPath - Path to the public key file
 * @returns {string} - Single line public key for upload
 */
function getPalmPayPublicKeyForUpload(publicKeyPath = null) {
  try {
    const defaultPath = path.join(
      __dirname,
      "..",
      "..",
      "keys",
      "public_key.pem"
    );
    const keyPath =
      publicKeyPath || process.env.PALMPAY_PUBLIC_KEY_PATH || defaultPath;

    if (!fs.existsSync(keyPath)) {
      throw new Error(`Public key file not found: ${keyPath}`);
    }

    let publicKey = fs.readFileSync(keyPath, "utf8");

    // Remove PEM headers and footers, and all line breaks
    publicKey = publicKey
      .replace("-----BEGIN PUBLIC KEY-----", "")
      .replace("-----END PUBLIC KEY-----", "")
      .replace("-----BEGIN RSA PUBLIC KEY-----", "")
      .replace("-----END RSA PUBLIC KEY-----", "")
      .replace(/\n/g, "")
      .replace(/\r/g, "")
      .replace(/\s+/g, "");

    return publicKey;
  } catch (error) {
    console.error("❌ Error loading public key:", error.message);
    throw error;
  }
}

/**
 * Get PalmPay's public key for verification
 * @returns {string} - PalmPay's public key
 */
function getPalmPayPublicKey() {
  // This is PalmPay's public key for signature verification
  return "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCVT+pLc1nkz9z803SOmF48bMFn0GYF4ng6nxj0ojUeu4KeNKkkw/nfureTtL77j9RpMjquJzzKdOZfHRvQyuAbaLoaSD1uU47npNiAL05bLYZEoZWvFOar9gNbIesea8MX0DeYncA2Tkr3kUo8K6XBrZ+TcV2Q8NEvm1T536LOGwIDAQAB";
}

module.exports = {
  getPalmPayPrivateKey,
  getPalmPayPublicKeyForUpload,
  getPalmPayPublicKey,
};

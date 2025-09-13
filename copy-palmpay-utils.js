const fs = require("fs");
const path = require("path");

// Source and destination directories
const sourceDir = path.join(__dirname, "src", "utils", "palmpay");
const destDir = path.join(__dirname, "dist", "utils", "palmpay");

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log("✅ Created dist/utils/palmpay directory");
}

// Copy all JavaScript files from source to destination
const files = fs.readdirSync(sourceDir).filter((file) => file.endsWith(".js"));

files.forEach((file) => {
  const sourceFile = path.join(sourceDir, file);
  const destFile = path.join(destDir, file);

  fs.copyFileSync(sourceFile, destFile);
  console.log(`📋 Copied ${file} to dist/utils/palmpay/`);
});

// Create the main palmpay.js file in dist/utils/
const destMainFile = path.join(__dirname, "dist", "utils", "palmpay.js");
const palmpayMainContent = `// PalmPay SDK utilities for KirkiData backend
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
};`;

fs.writeFileSync(destMainFile, palmpayMainContent);
console.log("📋 Created palmpay.js in dist/utils/");

// Copy keys directory if it exists
const keysSourceDir = path.join(__dirname, "src", "keys");
const keysDestDir = path.join(__dirname, "dist", "keys");

if (fs.existsSync(keysSourceDir)) {
  if (!fs.existsSync(keysDestDir)) {
    fs.mkdirSync(keysDestDir, { recursive: true });
    console.log("✅ Created dist/keys directory");
  }

  const keyFiles = fs
    .readdirSync(keysSourceDir)
    .filter((file) => file.endsWith(".pem"));
  keyFiles.forEach((file) => {
    const sourceFile = path.join(keysSourceDir, file);
    const destFile = path.join(keysDestDir, file);
    fs.copyFileSync(sourceFile, destFile);
    console.log(`🔑 Copied ${file} to dist/keys/`);
  });
} else {
  console.log("⚠️ No keys directory found in src/keys/");
}

console.log(
  "🎉 PalmPay utilities and keys copied to dist folder successfully!"
);

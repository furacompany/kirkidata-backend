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

// Copy the main palmpay.js file to dist/utils/
const mainPalmpayFile = path.join(__dirname, "dist-utils-palmpay.js");
const destMainFile = path.join(__dirname, "dist", "utils", "palmpay.js");

fs.copyFileSync(mainPalmpayFile, destMainFile);
console.log("📋 Copied palmpay.js to dist/utils/");

console.log("🎉 PalmPay utilities copied to dist folder successfully!");

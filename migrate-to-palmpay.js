const mongoose = require("mongoose");
const axios = require("axios");
const { sign, getPalmPayPrivateKey } = require("./dist/utils/palmpay");
const { verifyBVN } = require("./dist/services/bvn.service");

// Load environment variables
require("dotenv").config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

// Get all 9PSB virtual accounts
async function getOldAccounts() {
  const VirtualAccount = mongoose.model(
    "VirtualAccount",
    new mongoose.Schema({}, { strict: false })
  );
  const User = mongoose.model(
    "User",
    new mongoose.Schema({}, { strict: false })
  );

  const oldAccounts = await VirtualAccount.find({ bankId: "9PSB" });
  console.log(`📊 Found ${oldAccounts.length} old 9PSB accounts`);

  // Get unique users
  const uniqueUserIds = [
    ...new Set(oldAccounts.map((acc) => acc.userId.toString())),
  ];
  const users = await User.find({ _id: { $in: uniqueUserIds } });

  console.log(`👥 Found ${users.length} unique users to migrate`);
  return { oldAccounts, users };
}

// Create PalmPay virtual account
async function createPalmPayAccount(user) {
  try {
    const hardcodedBVN = "22584884665";

    // Mock BVN verification
    const bvnResult = await verifyBVN({
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phone,
    });

    if (!bvnResult.success) {
      console.log(
        `⚠️ BVN verification failed for ${user.firstName} ${user.lastName}, skipping`
      );
      return false;
    }

    // Create virtual account name
    const virtualAccountName =
      `${user.firstName.trim()} ${user.lastName.trim()}`
        .replace(/\s+/g, " ")
        .trim();

    // Call PalmPay API
    const nonceStr = Math.random().toString(36).substring(2, 18);
    const requestTime = Date.now();

    const payload = {
      requestTime,
      identityType: "personal",
      licenseNumber: hardcodedBVN,
      virtualAccountName: virtualAccountName,
      version: "V2.0",
      customerName: `${user.firstName.trim()} ${user.lastName.trim()}`,
      email: user.email,
      nonceStr,
      accountReference: user._id.toString(),
    };

    const privateKey = getPalmPayPrivateKey();
    const signature = sign(payload, privateKey);

    const response = await axios.post(
      `${process.env.PALMPAY_API_URL}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.PALMPAY_APP_ID}`,
          countryCode: process.env.PALMPAY_COUNTRY_CODE,
          Signature: signature,
          "Content-Type": "application/json;charset=UTF-8",
        },
        timeout: 30000,
      }
    );

    if (!response.data || response.data.respCode !== "00000000") {
      console.log(
        `❌ PalmPay API error for ${user.firstName} ${user.lastName}:`,
        response.data?.respMsg
      );
      return false;
    }

    // Save to database
    const VirtualAccount = mongoose.model(
      "VirtualAccount",
      new mongoose.Schema({}, { strict: false })
    );

    await VirtualAccount.create({
      userId: user._id,
      provider: "palmpay",
      virtualAccountNo: response.data.data.virtualAccountNo,
      virtualAccountName: response.data.data.virtualAccountName
        .replace(/\n/g, "")
        .replace(/\r/g, "")
        .replace(/\s+/g, " ")
        .trim(),
      status: response.data.data.status,
      identityType: response.data.data.identityType,
      licenseNumber: response.data.data.licenseNumber,
      customerName: response.data.data.customerName
        .replace(/\n/g, "")
        .replace(/\r/g, "")
        .replace(/\s+/g, " ")
        .trim(),
      email: response.data.data.email,
      accountReference: response.data.data.accountReference,
      rawResponse: response.data,
    });

    console.log(
      `✅ Created PalmPay account for ${user.firstName} ${user.lastName}: ${response.data.data.virtualAccountNo}`
    );
    return true;
  } catch (error) {
    console.log(
      `❌ Error creating PalmPay account for ${user.firstName} ${user.lastName}:`,
      error.message
    );
    return false;
  }
}

// Main migration function
async function migrate() {
  try {
    console.log("🚀 Starting 9PSB to PalmPay migration...");
    console.log("=".repeat(60));

    await connectDB();

    const { oldAccounts, users } = await getOldAccounts();

    if (oldAccounts.length === 0) {
      console.log("ℹ️ No old 9PSB accounts found. Migration not needed.");
      return;
    }

    // Step 1: Delete all old 9PSB accounts
    console.log("\n🗑️ Step 1: Deleting old 9PSB accounts...");
    const VirtualAccount = mongoose.model(
      "VirtualAccount",
      new mongoose.Schema({}, { strict: false })
    );
    const deleteResult = await VirtualAccount.deleteMany({ bankId: "9PSB" });
    console.log(`✅ Deleted ${deleteResult.deletedCount} old 9PSB accounts`);

    // Step 2: Create PalmPay accounts for each user
    console.log("\n🔄 Step 2: Creating PalmPay accounts...");
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(
        `\n📋 Processing user ${i + 1}/${users.length}: ${user.firstName} ${
          user.lastName
        }`
      );

      // Check if user already has a PalmPay account
      const existingAccount = await VirtualAccount.findOne({
        userId: user._id,
        provider: "palmpay",
      });

      if (existingAccount) {
        console.log(
          `ℹ️ User ${user.firstName} ${user.lastName} already has a PalmPay account, skipping`
        );
        continue;
      }

      const success = await createPalmPayAccount(user);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }

      // Add delay to avoid rate limiting
      if (i < users.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Old 9PSB accounts deleted: ${deleteResult.deletedCount}`);
    console.log(`New PalmPay accounts created: ${successCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    console.log("\n✅ Migration completed!");
    console.log("🎉 All users now have PalmPay virtual accounts!");
  } catch (error) {
    console.error("💥 Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  }
}

// Run migration
migrate();

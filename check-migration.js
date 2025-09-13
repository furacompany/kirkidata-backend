const mongoose = require("mongoose");

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

// Check what needs to be migrated
async function checkMigration() {
  try {
    console.log("🔍 Checking what needs to be migrated...");
    console.log("=".repeat(60));

    await connectDB();

    const VirtualAccount = mongoose.model(
      "VirtualAccount",
      new mongoose.Schema({}, { strict: false })
    );
    const User = mongoose.model(
      "User",
      new mongoose.Schema({}, { strict: false })
    );

    // Get all 9PSB accounts
    const oldAccounts = await VirtualAccount.find({ bankId: "9PSB" }).populate(
      "userId"
    );
    console.log(`📊 Found ${oldAccounts.length} old 9PSB accounts`);

    // Get unique users
    const uniqueUserIds = [
      ...new Set(oldAccounts.map((acc) => acc.userId._id.toString())),
    ];
    const users = await User.find({ _id: { $in: uniqueUserIds } });
    console.log(`👥 Found ${users.length} unique users to migrate`);

    // Check existing PalmPay accounts
    const existingPalmPayAccounts = await VirtualAccount.countDocuments({
      provider: "palmpay",
    });
    console.log(`ℹ️ Existing PalmPay accounts: ${existingPalmPayAccounts}`);

    if (oldAccounts.length > 0) {
      console.log("\n👥 Users to be migrated:");
      users.forEach((user, index) => {
        const userOldAccounts = oldAccounts.filter(
          (acc) => acc.userId._id.toString() === user._id.toString()
        );
        console.log(
          `   ${index + 1}. ${user.firstName} ${user.lastName} (${
            user.email
          }) - ${userOldAccounts.length} old 9PSB account(s)`
        );
      });

      console.log("\n📋 MIGRATION PLAN:");
      console.log(`1. Delete ${oldAccounts.length} old 9PSB virtual accounts`);
      console.log(`2. Create ${users.length} new PalmPay virtual accounts`);
      console.log(`3. Use hardcoded BVN: 22584884665`);
      console.log(
        `4. Estimated time: ${Math.ceil(
          (users.length * 2) / 60
        )} minutes (2 seconds per user)`
      );

      console.log("\n⚠️ IMPORTANT NOTES:");
      console.log(
        "   - This will permanently delete old 9PSB virtual account data"
      );
      console.log("   - New PalmPay accounts will be created for all users");
      console.log(
        "   - Users who already have PalmPay accounts will be skipped"
      );
      console.log(
        "   - Make sure to backup your database before running the actual migration"
      );

      console.log(
        "\n🚀 To run the actual migration, use: node migrate-to-palmpay.js"
      );
    } else {
      console.log("ℹ️ No old 9PSB accounts found. Migration not needed.");
    }
  } catch (error) {
    console.error("❌ Check failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  }
}

// Run check
checkMigration();

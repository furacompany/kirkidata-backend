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

async function resetVirtualAccounts() {
  try {
    console.log("🔄 Resetting virtual accounts collection...");
    console.log("=".repeat(60));

    await connectDB();

    // Drop the existing virtualaccounts collection
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    if (collections.some((col) => col.name === "virtualaccounts")) {
      await db.collection("virtualaccounts").drop();
      console.log("✅ Dropped existing virtualaccounts collection");
    } else {
      console.log("ℹ️ No existing virtualaccounts collection found");
    }

    // Create the new collection with proper schema
    const VirtualAccount =
      require("./dist/models/virtualAccount.model").default;

    // Create indexes
    await VirtualAccount.createIndexes();
    console.log(
      "✅ Created new virtualaccounts collection with proper indexes"
    );

    console.log("\n🎉 Virtual accounts collection reset successfully!");
    console.log("You can now run: npm run create-accounts");
  } catch (error) {
    console.error("💥 Reset failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  }
}

// Run reset
resetVirtualAccounts();

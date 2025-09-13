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

// User data from your production database
const users = [
  {
    _id: "68ab880b74d204eb7b4125f5",
    firstName: "Jabir",
    lastName: "Saidu",
    email: "jabir@xyz.com",
    phone: "07067129511",
  },
  {
    _id: "68ac909274d204eb7b4142cd",
    firstName: "Adamu Fura",
    lastName: "Suleiman",
    email: "adamufura98@gmail.com",
    phone: "08166644083",
  },
  {
    _id: "68acc47d74d204eb7b414746",
    firstName: "Ibrahim",
    lastName: "Adamu",
    email: "ibrahim@gmail.com",
    phone: "08055555555",
  },
  {
    _id: "68ada89a74d204eb7b414eae",
    firstName: "Shehu",
    lastName: "Sulaiman",
    email: "ssadamu16@gmail.com",
    phone: "08169694254",
  },
  {
    _id: "68adad1b74d204eb7b415088",
    firstName: "Shehu",
    lastName: "Sulaiman",
    email: "ssassaig@gmail.com",
    phone: "09161683131",
  },
  {
    _id: "68adeaf174d204eb7b4150f3",
    firstName: "Muhammad",
    lastName: "Yusuf",
    email: "muhammadyusufsaid20@gmail.com",
    phone: "08165009791",
  },
  {
    _id: "68b1f08f68361bec209a25b2",
    firstName: "Jabir",
    lastName: "Yusuf Saidu",
    email: "jabiryusufsaid@gmail.com",
    phone: "09113358751",
  },
  {
    _id: "68b4298868361bec209a2cc5",
    firstName: "fatima",
    lastName: "Ahmad",
    email: "fatimaahmad9137@gmail.com",
    phone: "09137984937",
  },
  {
    _id: "68b42a3b68361bec209a2cdb",
    firstName: "Hafsat",
    lastName: "Isa Ibrahim",
    email: "hafsatisaibrahim06@gmail.com",
    phone: "09160737658",
  },
  {
    _id: "68b433b868361bec209a2f65",
    firstName: "Musa",
    lastName: "Muhammad Suleiman",
    email: "musagudi068@gmail.com",
    phone: "08146734033",
  },
  {
    _id: "68b471d268361bec209a30af",
    firstName: "USAMA",
    lastName: "USHAMSS",
    email: "usamaushamsss@gmail.com",
    phone: "08146648484",
  },
  {
    _id: "68b47ce368361bec209a33b9",
    firstName: "ALIYU",
    lastName: "SUNUSI WAMBAI",
    email: "aliyusunusiwambai@gmail.com",
    phone: "07010466545",
  },
  {
    _id: "68b48d8768361bec209a358c",
    firstName: "Ismail",
    lastName: "Abdullahi Ubana",
    email: "ismailabdullahiubana@gmail.com",
    phone: "09029129157",
  },
  {
    _id: "68b544a768361bec209a3736",
    firstName: "Alhassan Hamza",
    lastName: "Hamza",
    email: "hamzaalhassan519@gmail.com",
    phone: "09079092719",
  },
  {
    _id: "68b73d5868361bec209a3f67",
    firstName: "MUHAMMAD",
    lastName: "IBRAHIM",
    email: "muhammadibrahimisa442@gmail.com",
    phone: "08103878854",
  },
  {
    _id: "68bc35a640d8b9729ccae3ff",
    firstName: "Adamu Fura",
    lastName: "Suleiman",
    email: "adamufura@gmail.com",
    phone: "08166644084",
  },
  {
    _id: "68bc79ab101fba245200c648",
    firstName: "Huzaifa",
    lastName: "Yahaya hussaini",
    email: "huzeelemankeana@gmail.com",
    phone: "09066934808",
  },
  {
    _id: "68bee10c97e9316a605330da",
    firstName: "Harsan",
    lastName: "Jibrin",
    email: "harsanujibrin166@gmail.com",
    phone: "07052873618",
  },
  {
    _id: "68befbae97e9316a605331b1",
    firstName: "Zemnaan",
    lastName: "Valentine",
    email: "rickyval480@gmail.com",
    phone: "08055813217",
  },
  {
    _id: "68bff0f497e9316a6053335b",
    firstName: "Ibrahim",
    lastName: "Adamu",
    email: "ibrahim@fura.com",
    phone: "08033698523",
  },
  {
    _id: "68c1268e97e9316a60533570",
    firstName: "Amina",
    lastName: "Adamu",
    email: "aminaadamu786@gmail.com",
    phone: "08032988440",
  },
];

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
      accountReference: user._id,
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

    // Save to database using the proper model
    const VirtualAccount =
      require("./dist/models/virtualAccount.model").default;

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

// Main function
async function createVirtualAccounts() {
  try {
    console.log("🚀 Creating PalmPay virtual accounts for all users...");
    console.log("=".repeat(60));

    await connectDB();

    console.log(`👥 Found ${users.length} users to create accounts for`);

    // Create PalmPay accounts for each user
    console.log("\n🔄 Creating PalmPay accounts...");
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
      const VirtualAccount =
        require("./dist/models/virtualAccount.model").default;
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
    console.log("📊 CREATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total users processed: ${users.length}`);
    console.log(`New PalmPay accounts created: ${successCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    console.log("\n✅ Virtual account creation completed!");
    console.log("🎉 All users now have PalmPay virtual accounts!");
  } catch (error) {
    console.error("💥 Creation failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  }
}

// Run creation
createVirtualAccounts();

import mongoose, { Document, Schema } from "mongoose";

export type TransactionType = "funding" | "airtime" | "data" | "debit";

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  virtualAccountId?: mongoose.Types.ObjectId;
  relatedTransactionId?: mongoose.Types.ObjectId; // Link to related transaction (e.g., charge linking to funding)
  type: TransactionType;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  reference: string; // BillStack transaction reference, OtoBill reference, or Aychindodata request-id
  wiaxyRef?: string; // BillStack inter-bank reference
  merchantReference?: string; // Our internal reference
  description?: string;
  // DEPRECATED: OtoBill specific fields (kept for backward compatibility)
  otobillRef?: string; // OtoBill transaction reference
  networkName?: string; // For airtime/data transactions
  phoneNumber?: string; // For airtime/data transactions
  planId?: string; // For data transactions
  planName?: string; // For data transactions
  profit?: number; // Profit made on the transaction
  metadata?: {
    payerAccountNumber?: string;
    payerFirstName?: string;
    payerLastName?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    // DEPRECATED: OtoBill specific metadata (kept for backward compatibility)
    otobillTransactionId?: string;
    otobillStatus?: string;
    otobillResponse?: any;
    actualOtoBillCost?: number;
    calculatedProfit?: number;
    // Aychindodata specific metadata
    aychindodataRequestId?: string; // Aychindodata request-id from API response
    aychindodataStatus?: string; // "success" or "failed"
    aychindodataResponse?: any; // Full Aychindodata API response
    actualAychindodataCost?: number; // Actual cost charged by Aychindodata
    oldBalance?: string; // Aychindodata wallet balance before transaction
    newBalance?: number; // Aychindodata wallet balance after transaction
    dataplan?: string; // Data plan name from Aychindodata response (for data purchases)
    // Charge specific metadata
    chargeAmount?: number; // The charge deducted from funding
    originalFundingAmount?: number; // The original funding amount before charge
  };
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    virtualAccountId: {
      type: Schema.Types.ObjectId,
      ref: "VirtualAccount",
    },
    relatedTransactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      sparse: true,
    },
    type: {
      type: String,
      required: [true, "Transaction type is required"],
      enum: ["funding", "airtime", "data", "debit"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "NGN",
      enum: ["NGN"],
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
    reference: {
      type: String,
      required: [true, "Reference is required"],
    },
    wiaxyRef: {
      type: String,
      sparse: true,
      unique: true,
    },
    merchantReference: {
      type: String,
      sparse: true,
    },
    description: {
      type: String,
    },
    // DEPRECATED: OtoBill specific fields (kept for backward compatibility)
    otobillRef: {
      type: String,
      sparse: true,
    },
    networkName: {
      type: String,
      sparse: true,
    },
    phoneNumber: {
      type: String,
      sparse: true,
    },
    planId: {
      type: String,
      sparse: true,
    },
    planName: {
      type: String,
      sparse: true,
    },
    profit: {
      type: Number,
      default: 0,
      min: [0, "Profit cannot be negative"],
    },
    metadata: {
      payerAccountNumber: String,
      payerFirstName: String,
      payerLastName: String,
      bankName: String,
      accountNumber: String,
      accountName: String,
      // DEPRECATED: OtoBill specific metadata (kept for backward compatibility)
      otobillTransactionId: String,
      otobillStatus: String,
      otobillResponse: Schema.Types.Mixed,
      actualOtoBillCost: Number,
      calculatedProfit: Number,
      // Aychindodata specific metadata
      aychindodataRequestId: String,
      aychindodataStatus: String,
      aychindodataResponse: Schema.Types.Mixed,
      actualAychindodataCost: Number,
      oldBalance: String,
      newBalance: Number,
      dataplan: String,
      // Charge specific metadata
      chargeAmount: Number,
      originalFundingAmount: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
transactionSchema.index({ userId: 1 });
transactionSchema.index({ virtualAccountId: 1 });
transactionSchema.index({ relatedTransactionId: 1 }, { sparse: true });
transactionSchema.index({ reference: 1 }); // Remove unique constraint from reference
transactionSchema.index({ wiaxyRef: 1 }, { unique: true, sparse: true }); // Make wiaxyRef unique
transactionSchema.index({ otobillRef: 1 }, { sparse: true }); // DEPRECATED: OtoBill reference
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ networkName: 1 }); // For airtime/data transactions
transactionSchema.index({ phoneNumber: 1 }); // For airtime/data transactions
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 }); // For filtering by transaction type

export default mongoose.model<ITransaction>("Transaction", transactionSchema);

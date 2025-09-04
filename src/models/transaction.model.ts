import mongoose, { Document, Schema } from "mongoose";

export type TransactionType = "funding" | "airtime" | "data";

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  virtualAccountId?: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  reference: string; // BillStack transaction reference or OtoBill reference
  wiaxyRef?: string; // BillStack inter-bank reference
  merchantReference?: string; // Our internal reference
  description?: string;
  // OtoBill specific fields
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
    // OtoBill specific metadata
    otobillTransactionId?: string;
    otobillStatus?: string;
    otobillResponse?: any;
    actualOtoBillCost?: number;
    calculatedProfit?: number;
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
    type: {
      type: String,
      required: [true, "Transaction type is required"],
      enum: ["funding", "airtime", "data"],
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
    // OtoBill specific fields
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
      // OtoBill specific metadata
      otobillTransactionId: String,
      otobillStatus: String,
      otobillResponse: Schema.Types.Mixed,
      actualOtoBillCost: Number,
      calculatedProfit: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
transactionSchema.index({ userId: 1 });
transactionSchema.index({ virtualAccountId: 1 });
transactionSchema.index({ reference: 1 }); // Remove unique constraint from reference
transactionSchema.index({ wiaxyRef: 1 }, { unique: true, sparse: true }); // Make wiaxyRef unique
transactionSchema.index({ otobillRef: 1 }, { sparse: true }); // OtoBill reference
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ networkName: 1 }); // For airtime/data transactions
transactionSchema.index({ phoneNumber: 1 }); // For airtime/data transactions
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 }); // For filtering by transaction type

export default mongoose.model<ITransaction>("Transaction", transactionSchema);

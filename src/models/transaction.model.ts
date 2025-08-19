import mongoose, { Document, Schema } from "mongoose";

export type TransactionType = "funding";

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  virtualAccountId?: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  reference: string; // BillStack transaction reference
  wiaxyRef?: string; // BillStack inter-bank reference
  merchantReference?: string; // Our internal reference
  description?: string;
  metadata?: {
    payerAccountNumber?: string;
    payerFirstName?: string;
    payerLastName?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
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
      enum: ["funding"],
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
    metadata: {
      payerAccountNumber: String,
      payerFirstName: String,
      payerLastName: String,
      bankName: String,
      accountNumber: String,
      accountName: String,
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
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<ITransaction>("Transaction", transactionSchema);

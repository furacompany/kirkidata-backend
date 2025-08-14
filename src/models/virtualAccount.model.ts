import mongoose, { Document, Schema } from "mongoose";
import { BankType } from "../constants/banks.constant";

export interface IVirtualAccount extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reference: string; // BillStack reference
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankId: BankType;
  isActive: boolean;
  isKYCVerified: boolean;
  bvn?: string;
  createdAt: Date;
  updatedAt: Date;
}

const virtualAccountSchema = new Schema<IVirtualAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    reference: {
      type: String,
      required: [true, "Reference is required"],
      unique: true,
    },
    accountNumber: {
      type: String,
      required: [true, "Account number is required"],
      unique: true,
    },
    accountName: {
      type: String,
      required: [true, "Account name is required"],
    },
    bankName: {
      type: String,
      required: [true, "Bank name is required"],
    },
    bankId: {
      type: String,
      required: [true, "Bank ID is required"],
      enum: Object.values(BankType),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isKYCVerified: {
      type: Boolean,
      default: false,
    },
    bvn: {
      type: String,
      sparse: true, // Allow multiple null values
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
virtualAccountSchema.index({ userId: 1 });
virtualAccountSchema.index({ reference: 1 }, { unique: true });
virtualAccountSchema.index({ accountNumber: 1 }, { unique: true });
virtualAccountSchema.index({ isActive: 1 });
virtualAccountSchema.index({ isKYCVerified: 1 });

export default mongoose.model<IVirtualAccount>(
  "VirtualAccount",
  virtualAccountSchema
);

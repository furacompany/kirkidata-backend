import mongoose, { Document, Schema } from "mongoose";

export interface IVirtualAccount extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  provider: "palmpay";
  virtualAccountNo: string; // PalmPay virtual account number
  virtualAccountName: string; // PalmPay virtual account name
  status: "Enabled" | "Disabled" | "Deleted";
  identityType: "personal" | "personal_nin" | "company";
  licenseNumber: string; // BVN, NIN, or CAC number
  customerName: string;
  email?: string;
  accountReference?: string; // Custom reference field
  rawResponse?: any; // Store PalmPay API response
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
    provider: {
      type: String,
      required: [true, "Provider is required"],
      enum: ["palmpay"],
      default: "palmpay",
    },
    virtualAccountNo: {
      type: String,
      required: [true, "Virtual account number is required"],
      unique: true,
    },
    virtualAccountName: {
      type: String,
      required: [true, "Virtual account name is required"],
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["Enabled", "Disabled", "Deleted"],
      default: "Enabled",
    },
    identityType: {
      type: String,
      required: [true, "Identity type is required"],
      enum: ["personal", "personal_nin", "company"],
    },
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
    },
    email: {
      type: String,
      sparse: true,
    },
    accountReference: {
      type: String,
      sparse: true,
    },
    rawResponse: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
virtualAccountSchema.index({ userId: 1 });
virtualAccountSchema.index({ virtualAccountNo: 1 }, { unique: true });
virtualAccountSchema.index({ provider: 1 });
virtualAccountSchema.index({ status: 1 });
virtualAccountSchema.index({ identityType: 1 });
virtualAccountSchema.index({ accountReference: 1 });

export default mongoose.model<IVirtualAccount>(
  "VirtualAccount",
  virtualAccountSchema
);

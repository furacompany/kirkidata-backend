import mongoose, { Document, Schema } from "mongoose";

export interface IDataPlan extends Document {
  _id: mongoose.Types.ObjectId;
  customId: string; // e.g., PLAN_1, PLAN_2
  planId: string; // Aychindodata plan ID (e.g., "9", "7", "8") - used for both DB and API calls
  name: string;
  networkName: string;
  planType: string;
  dataSize: string; // e.g., "1GB", "500MB", "2GB"
  validityDays: number;
  originalPrice?: number; // Original price from Aychindodata (optional)
  adminPrice: number; // Price set by admin (required for operations)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const dataPlanSchema = new Schema<IDataPlan>(
  {
    customId: {
      type: String,
      required: [true, "Custom ID is required"],
      unique: true,
      trim: true,
    },
    planId: {
      type: String,
      required: [true, "Plan ID (Aychindodata plan ID) is required"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
    },
    networkName: {
      type: String,
      required: [true, "Network name is required"],
      trim: true,
    },
    planType: {
      type: String,
      required: [true, "Plan type is required"],
      trim: true,
    },
    dataSize: {
      type: String,
      required: [true, "Data size is required"],
      trim: true,
    },
    validityDays: {
      type: Number,
      required: [true, "Validity days is required"],
      min: [1, "Validity days must be at least 1"],
    },
    originalPrice: {
      type: Number,
      required: false, // Made optional since it might not be available during sync
      min: [0, "Original price cannot be negative"],
    },
    adminPrice: {
      type: Number,
      required: [true, "Admin price is required"],
      min: [0, "Admin price cannot be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
dataPlanSchema.index({ customId: 1 }, { unique: true });
dataPlanSchema.index({ planId: 1 }, { unique: true }); // Ensure planId is unique
dataPlanSchema.index({ networkName: 1 });
dataPlanSchema.index({ planType: 1 });
dataPlanSchema.index({ isActive: 1 });

export default mongoose.model<IDataPlan>("DataPlan", dataPlanSchema);

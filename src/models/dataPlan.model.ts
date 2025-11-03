import mongoose, { Document, Schema } from "mongoose";

export interface IDataPlan extends Document {
  _id: mongoose.Types.ObjectId;
  customId: string; // e.g., PLAN_1, PLAN_2
  aychindodataId: number; // Aychindodata's numeric plan ID (required for API calls)
  planId: string; // Plan ID as string identifier (optional, for reference)
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
    aychindodataId: {
      type: Number,
      required: [true, "Aychindodata plan ID is required"],
    },
    planId: {
      type: String,
      required: false, // Optional string identifier
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
dataPlanSchema.index({ aychindodataId: 1 }, { unique: true });
dataPlanSchema.index({ planId: 1 });
dataPlanSchema.index({ networkName: 1 });
dataPlanSchema.index({ planType: 1 });
dataPlanSchema.index({ isActive: 1 });

export default mongoose.model<IDataPlan>("DataPlan", dataPlanSchema);

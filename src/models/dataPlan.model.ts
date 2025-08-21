import mongoose, { Document, Schema } from "mongoose";

export interface IDataPlan extends Document {
  _id: mongoose.Types.ObjectId;
  customId: string; // e.g., PLAN_1, PLAN_2
  otobillId: string; // OtoBill's internal ID
  planId: string; // OtoBill's plan ID
  name: string;
  networkName: string;
  planType: string;
  validityDays: number;
  originalPrice: number; // Price from OtoBill
  adminPrice: number; // Price set by admin
  isActive: boolean;
  isVisible: boolean;
  lastSynced: Date;
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
    otobillId: {
      type: String,
      required: [true, "OtoBill ID is required"],
      trim: true,
    },
    planId: {
      type: String,
      required: [true, "Plan ID is required"],
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
    validityDays: {
      type: Number,
      required: [true, "Validity days is required"],
      min: [1, "Validity days must be at least 1"],
    },
    originalPrice: {
      type: Number,
      required: [true, "Original price is required"],
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
    isVisible: {
      type: Boolean,
      default: true,
    },
    lastSynced: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
dataPlanSchema.index({ customId: 1 }, { unique: true });
dataPlanSchema.index({ otobillId: 1 });
dataPlanSchema.index({ planId: 1 });
dataPlanSchema.index({ networkName: 1 });
dataPlanSchema.index({ planType: 1 });
dataPlanSchema.index({ isActive: 1 });
dataPlanSchema.index({ isVisible: 1 });
dataPlanSchema.index({ lastSynced: -1 });

export default mongoose.model<IDataPlan>("DataPlan", dataPlanSchema);

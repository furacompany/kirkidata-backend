import mongoose, { Document, Schema } from "mongoose";

export interface IAirtime extends Document {
  _id: mongoose.Types.ObjectId;
  networkName: string;
  originalPrice: number; // Original price from Aychindodata (usually 0 for airtime)
  adminPrice: number; // Price set by admin (usually 0 for airtime)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const airtimeSchema = new Schema<IAirtime>(
  {
    networkName: {
      type: String,
      required: [true, "Network name is required"],
      unique: true,
      trim: true,
    },
    originalPrice: {
      type: Number,
      default: 0, // Airtime usually has no markup from OtoBill
      min: [0, "Original price cannot be negative"],
    },
    adminPrice: {
      type: Number,
      default: 0, // Admin can set custom pricing if needed
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
airtimeSchema.index({ networkName: 1 }, { unique: true });
airtimeSchema.index({ isActive: 1 });

export default mongoose.model<IAirtime>("Airtime", airtimeSchema);

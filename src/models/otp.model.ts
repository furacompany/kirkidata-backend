import mongoose, { Document, Schema } from "mongoose";

export interface IOTP extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  otp: string;
  type: "email_verification" | "password_reset";
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;

  // Schema methods
  isExpired(): boolean;
  markAsUsed(): void;
}

const otpSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: [true, "OTP is required"],
      length: [6, "OTP must be exactly 6 digits"],
      validate: {
        validator: function (v: string) {
          return /^\d{6}$/.test(v);
        },
        message: "OTP must contain exactly 6 digits",
      },
    },
    type: {
      type: String,
      enum: ["email_verification", "password_reset"],
      required: [true, "OTP type is required"],
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration time is required"],
      index: { expireAfterSeconds: 0 }, // TTL index to auto-delete expired OTPs
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
otpSchema.index({ email: 1, type: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if OTP is expired
otpSchema.methods.isExpired = function (this: IOTP): boolean {
  return new Date() > this.expiresAt;
};

// Method to mark OTP as used
otpSchema.methods.markAsUsed = function (this: IOTP): void {
  this.isUsed = true;
};

export default mongoose.model<IOTP>("OTP", otpSchema);

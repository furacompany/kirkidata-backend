import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  pin: string; // Required during registration
  isEmailVerified: boolean;
  isActive: boolean;
  wallet: number;
  lastLoginAt?: Date;
  lastLogoutAt?: Date;
  profile: {
    avatar?: string;
    dateOfBirth?: Date;
    address?: string;
    state?: string;
  };

  setPassword(newPassword: string): Promise<void>;
  comparePassword(candidatePassword: string): Promise<boolean>;
  verifyPassword(candidatePassword: string): Promise<boolean>;
  setPin(newPin: string): Promise<void>;
  comparePin(candidatePin: string): Promise<boolean>;
  verifyPin(candidatePin: string): Promise<boolean>;
  hashPassword(): Promise<void>;
  hashPin(): Promise<void>;
}

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [/^[0-9]{11}$/, "Phone number must be exactly 11 digits"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      // Note: Length validation is handled in the setPassword method before hashing
    },
    pin: {
      type: String,
      required: true, // Changed from false to true
      // Note: PIN validation is handled in the setPin method before hashing
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    wallet: {
      type: Number,
      default: 0,
      min: [0, "Wallet balance cannot be negative"],
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastLogoutAt: {
      type: Date,
      default: null,
    },
    profile: {
      avatar: String,
      dateOfBirth: Date,
      address: String,
      state: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: any) {
        delete ret.password;
        delete ret.pin;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLoginAt: -1 });

// Pre-save middleware to hash password and PIN (only for new/plain text values)
userSchema.pre("save", async function (next) {
  try {
    const self = this as any;

    // Only hash password if it's modified and not already hashed (bcrypt hashes start with $2b$)
    if (
      self.isModified("password") &&
      self.password &&
      !self.password.startsWith("$2b$")
    ) {
      await self.hashPassword();
    }

    // Only hash PIN if it's modified and not already hashed (bcrypt hashes start with $2b$)
    if (self.isModified("pin") && self.pin && !self.pin.startsWith("$2b$")) {
      await self.hashPin();
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Hash password method
userSchema.methods.hashPassword = async function (): Promise<void> {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
  this.password = await bcrypt.hash(this.password, saltRounds);
};

// Set password (validates and hashes)
userSchema.methods.setPassword = async function (
  newPassword: string
): Promise<void> {
  if (
    typeof newPassword !== "string" ||
    newPassword.length < 6 ||
    newPassword.length > 12
  ) {
    throw new Error("Password must be between 6 and 12 characters");
  }
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
  this.password = await bcrypt.hash(newPassword, saltRounds);
};

// Hash PIN method
userSchema.methods.hashPin = async function (): Promise<void> {
  const saltRounds = parseInt(process.env.PIN_BCRYPT_ROUNDS || "10");
  this.pin = await bcrypt.hash(this.pin, saltRounds);
};

// Set PIN (validates 4 digits and hashes)
userSchema.methods.setPin = async function (newPin: string): Promise<void> {
  if (!/^\d{4}$/.test(newPin)) {
    throw new Error("PIN must be exactly 4 digits");
  }
  const saltRounds = parseInt(process.env.PIN_BCRYPT_ROUNDS || "10");
  this.pin = await bcrypt.hash(newPin, saltRounds);
};

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Verify password alias
userSchema.methods.verifyPassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Compare PIN method
userSchema.methods.comparePin = async function (
  candidatePin: string
): Promise<boolean> {
  return bcrypt.compare(candidatePin, this.pin);
};

// Verify PIN alias
userSchema.methods.verifyPin = async function (
  candidatePin: string
): Promise<boolean> {
  return bcrypt.compare(candidatePin, this.pin);
};

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  const self = this as any;
  return `${self.firstName} ${self.lastName}`;
});

export default mongoose.model<IUser>("User", userSchema);

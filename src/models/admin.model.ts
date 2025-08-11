import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

export interface IAdmin extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  isActive: boolean;
  role: "admin" | "super_admin";
  lastLoginAt?: Date;
  lastLogoutAt?: Date;

  setPassword(newPassword: string): Promise<void>;
  comparePassword(candidatePassword: string): Promise<boolean>;
  verifyPassword(candidatePassword: string): Promise<boolean>;
  hashPassword(): Promise<void>;
}

const adminSchema = new Schema<IAdmin>(
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
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["admin", "super_admin"],
      default: "admin",
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastLogoutAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: any) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Indexes
adminSchema.index({ email: 1 }, { unique: true });
adminSchema.index({ phone: 1 }, { unique: true });
adminSchema.index({ isActive: 1 });
adminSchema.index({ createdAt: -1 });
adminSchema.index({ lastLoginAt: -1 });

// Pre-save middleware to hash password (only for new/plain text values)
adminSchema.pre("save", async function (next) {
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

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Hash password method
adminSchema.methods.hashPassword = async function (): Promise<void> {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
  this.password = await bcrypt.hash(this.password, saltRounds);
};

// Set password (validates and hashes)
adminSchema.methods.setPassword = async function (
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

// Compare password method
adminSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Verify password alias
adminSchema.methods.verifyPassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
adminSchema.virtual("fullName").get(function () {
  const self = this as any;
  return `${self.firstName} ${self.lastName}`;
});

export default mongoose.model<IAdmin>("Admin", adminSchema);

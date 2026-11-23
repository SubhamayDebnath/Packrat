import mongoose, { type InferSchemaType, type Model } from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, maxlength: 32 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    isAdmin: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "pending"], default: "pending" },
    activationTokenHash: { type: String, select: false },
    activationExpires: { type: Date, select: false },
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

// Only one admin can ever exist, and the database enforces it. This makes
// "first registered user becomes admin" safe even if two people race.
userSchema.index(
  { isAdmin: 1 },
  { unique: true, partialFilterExpression: { isAdmin: true } },
);
userSchema.index({ activationTokenHash: 1 }, { sparse: true });

export type UserDoc = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) || mongoose.model<UserDoc>("User", userSchema);

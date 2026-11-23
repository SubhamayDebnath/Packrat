import mongoose, { type Model } from "mongoose";

const rateLimitSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expireAt: { type: Date, required: true },
});
rateLimitSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

type RateLimitDoc = { key: string; count: number; expireAt: Date };

export const RateLimit: Model<RateLimitDoc> =
  (mongoose.models.RateLimit as Model<RateLimitDoc>) ||
  mongoose.model<RateLimitDoc>("RateLimit", rateLimitSchema);

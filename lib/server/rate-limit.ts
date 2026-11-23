import { RateLimit } from "./models/rate-limit";
import { ApiError } from "./api";

/** Mongo-backed fixed-window limiter. Works across serverless instances (in-memory would not). */
export async function hit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const doc = await RateLimit.findOneAndUpdate(
    { key },
    { $inc: { count: 1 }, $setOnInsert: { expireAt: new Date(now + windowMs) } },
    { upsert: true, returnDocument: "after" },
  ).lean();
  if (doc.count > limit) {
    const wait = Math.max(1, Math.ceil((doc.expireAt.getTime() - now) / 60000));
    throw new ApiError(
      429,
      `Too many attempts. Try again in ${wait} minute${wait === 1 ? "" : "s"}.`,
    );
  }
}

export async function reset(key: string) {
  await RateLimit.deleteOne({ key });
}

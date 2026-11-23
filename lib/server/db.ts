import mongoose from "mongoose";
import { attachDatabasePool } from "@vercel/functions";
import { env } from "./env";

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

const globalCache = globalThis as unknown as { __packratMongoose?: Cache };
const cache: Cache = (globalCache.__packratMongoose ??= { conn: null, promise: null });

/**
 * One cached connection per runtime instance (survives hot reloads in dev and warm functions on Vercel).
 * The pool is deliberately tiny so many concurrent instances stay inside the Atlas M0 limit (500).
 */
export async function connectDB() {
  if (cache.conn) return cache.conn;
  cache.promise ??= mongoose
    .connect(env.mongoUri, {
      bufferCommands: false,
      maxPoolSize: 3,
      minPoolSize: 0,
      maxIdleTimeMS: 10_000, // release idle sockets quickly
      serverSelectionTimeoutMS: 8_000,
      socketTimeoutMS: 20_000,
      appName: "packrat",
    })
    .then((m) => {
      try {
        // On Vercel, lets Fluid compute close idle connections before a function is suspended. No-op elsewhere.
        attachDatabasePool(m.connection.getClient());
      } catch {}
      return m;
    });
  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
  return cache.conn;
}

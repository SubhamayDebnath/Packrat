import "server-only";
import { connection } from "next/server";
import { connectDB } from "./db";
import { User } from "./models/user";

export async function hasAnyUser() {
  await connection(); // always evaluate per request, never at build time
  await connectDB();
  return (await User.estimatedDocumentCount()) > 0;
}

import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { connectDB } from "./db";
import { getSessionUser, type SessionUser } from "./auth";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

type Ctx = { params: Promise<Record<string, string>> };
type Opts = { auth?: "none" | "user" | "admin" };
type Args = { req: NextRequest; user: SessionUser; params: Record<string, string> };

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** CSRF defence in depth: cookies are SameSite=Lax, and mutating requests must also be same-origin. */
function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) {
    if (req.headers.get("sec-fetch-site") === "cross-site")
      throw new ApiError(403, "Cross-site request blocked");
    return;
  }
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {}
  if (!host || originHost !== host) throw new ApiError(403, "Cross-site request blocked");
}

export function clientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function origin(req: NextRequest) {
  const proto =
    req.headers.get("x-forwarded-proto") ??
    (req.nextUrl.protocol.replace(":", "") || "http");
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  return `${proto}://${host}`;
}

export async function readJson<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Invalid request body");
  }
  return schema.parse(body);
}

export function handler(opts: Opts, fn: (args: Args) => Promise<Response | object>) {
  return async (req: NextRequest, ctx: Ctx) => {
    try {
      if (!SAFE_METHODS.has(req.method)) assertSameOrigin(req);
      await connectDB();
      let user: SessionUser | null = null;
      if (opts.auth !== "none") {
        user = await getSessionUser();
        if (!user) throw new ApiError(401, "Please sign in again");
        if (opts.auth === "admin" && !user.isAdmin)
          throw new ApiError(403, "Admins only");
      }
      const params = (await ctx.params) ?? {};
      const result = await fn({ req, user: user as SessionUser, params });
      if (result instanceof Response) return result;
      return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message, fields: error.fields },
          { status: error.status },
        );
      }
      if (error instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const issue of error.issues)
          fields[issue.path.join(".") || "_"] ??= issue.message;
        const first = error.issues[0]?.message ?? "Invalid input";
        return NextResponse.json({ error: first, fields }, { status: 400 });
      }
      console.error("[api]", error);
      return NextResponse.json(
        { error: "Something went wrong. Try again." },
        { status: 500 },
      );
    }
  };
}

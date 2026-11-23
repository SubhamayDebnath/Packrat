import dns from "node:dns";
import net from "node:net";
import * as cheerio from "cheerio";
import { Agent, fetch as undiciFetch } from "undici";
import { isPublicIp } from "./ip";

export type Metadata = {
  url: string;
  title: string;
  description: string;
  domain: string;
  favicon: { data: Buffer; type: string } | null;
};

const UA = "Mozilla/5.0 (compatible; PackratBot/1.0; +link-preview)";
const MAX_HTML = 1_000_000;
const MAX_ICON = 32 * 1024;
const MAX_REDIRECTS = 4;
const ICON_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]); // SVG is deliberately excluded: opened directly, it could run script.

/** Adds https:// when missing, drops credentials and fragments, rejects anything that is not http(s). */
export function normalizeUrl(input: string): URL | null {
  let raw = input.trim();
  if (!raw || /\s/.test(raw)) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (
      !url.hostname.includes(".") &&
      !net.isIP(url.hostname.replace(/^\[|\]$/g, "")) &&
      url.hostname !== "localhost"
    ) {
      return null;
    }
    url.username = "";
    url.password = "";
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

// DNS lookup that refuses non-public addresses. It runs at connect time for every hop,
// which also closes the DNS-rebinding gap between "check" and "use".
function safeLookup(
  hostname: string,
  options: dns.LookupOptions,
  cb: (...args: unknown[]) => void,
) {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return cb(err);
    const list = (addresses as dns.LookupAddress[]).filter((a) => isPublicIp(a.address));
    if (!list.length) return cb(new Error("blocked_address"));
    if (options.all) return cb(null, list);
    cb(null, list[0].address, list[0].family);
  });
}

const safeAgent = new Agent({ connect: { lookup: safeLookup as never } });

async function safeFetch(start: URL, accept: string, maxBytes: number) {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const host = url.hostname.replace(/^\[|\]$/g, "");
    if (net.isIP(host) && !isPublicIp(host)) throw new Error("blocked_address");

    const res = await undiciFetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(7000),
      headers: { "user-agent": UA, accept, "accept-language": "en" },
      dispatcher: safeAgent,
    });

    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      const next = new URL(res.headers.get("location")!, url);
      if (next.protocol !== "http:" && next.protocol !== "https:")
        throw new Error("bad_redirect");
      await res.body?.cancel();
      url = next;
      continue;
    }
    if (!res.ok || !res.body) {
      await res.body?.cancel();
      throw new Error(`status_${res.status}`);
    }

    const chunks: Uint8Array[] = [];
    let size = 0;
    const reader = res.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        break; // enough: titles and icons live near the top
      }
      chunks.push(value);
    }
    return {
      url,
      type: (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase(),
      body: Buffer.concat(chunks),
    };
  }
  throw new Error("too_many_redirects");
}

const clip = (value: string | undefined, max: number) =>
  (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

async function fetchIcon(candidates: URL[]): Promise<Metadata["favicon"]> {
  for (const candidate of candidates.slice(0, 3)) {
    try {
      const { body, type } = await safeFetch(candidate, "image/*", MAX_ICON + 1);
      if (body.length === 0 || body.length > MAX_ICON) continue;
      let mime = type;
      if (!ICON_TYPES.has(mime)) {
        if (candidate.pathname.endsWith(".ico")) mime = "image/x-icon";
        else continue;
      }
      return { data: body, type: mime };
    } catch {
      // try next candidate
    }
  }
  return null;
}

export async function fetchMetadata(input: URL): Promise<Metadata> {
  const fallback: Metadata = {
    url: input.toString(),
    title: input.hostname.replace(/^www\./, ""),
    description: "",
    domain: input.hostname.replace(/^www\./, ""),
    favicon: null,
  };

  let page: Awaited<ReturnType<typeof safeFetch>>;
  try {
    page = await safeFetch(input, "text/html,application/xhtml+xml", MAX_HTML);
  } catch {
    return fallback;
  }

  const base = page.url;
  const isHtml = page.type.includes("html") || page.type === "";
  const $ = isHtml ? cheerio.load(page.body.toString("utf8")) : null;
  const meta = (sel: string) => $?.(sel).attr("content");

  const title =
    clip(
      meta('meta[property="og:title"]') ||
        meta('meta[name="twitter:title"]') ||
        $?.("title").first().text(),
      200,
    ) || fallback.title;
  const description = clip(
    meta('meta[property="og:description"]') ||
      meta('meta[name="description"]') ||
      meta('meta[name="twitter:description"]'),
    400,
  );

  const candidates: URL[] = [];
  const push = (href?: string) => {
    if (!href) return;
    try {
      const u = new URL(href, base);
      if (u.protocol === "http:" || u.protocol === "https:") candidates.push(u);
    } catch {}
  };
  if ($) {
    const links = $(
      'link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]',
    ).toArray();
    // Prefer small raster icons; they are cheapest and render crisply at 16px.
    links.sort(
      (a, b) =>
        Number(!!$(a).attr("sizes")?.includes("180")) -
        Number(!!$(b).attr("sizes")?.includes("180")),
    );
    for (const el of links) push($(el).attr("href"));
  }
  push("/favicon.ico");

  const favicon = await fetchIcon(candidates);
  return { url: input.toString(), title, description, domain: fallback.domain, favicon };
}

// Tiny cache so "preview in the dialog" and "save" do not fetch the same page twice.
const cache = new Map<string, { at: number; meta: Metadata }>();
export async function fetchMetadataCached(input: URL): Promise<Metadata> {
  const key = input.toString();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 60_000) return hit.meta;
  const meta = await fetchMetadata(input);
  if (cache.size > 50) cache.delete(cache.keys().next().value as string);
  cache.set(key, { at: Date.now(), meta });
  return meta;
}

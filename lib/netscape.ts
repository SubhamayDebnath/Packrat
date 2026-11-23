import type { Bookmark, Group, ImportPayload } from "@/types";

const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const encode = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Parses the Netscape bookmark format every browser exports. Nested folders are flattened to their nearest folder. */
export function parseNetscape(html: string, fallbackGroup: string): ImportPayload {
  const token =
    /<H3[^>]*>([\s\S]*?)<\/H3>|<A\s([^>]*)>([\s\S]*?)<\/A>|<DL[^>]*>|<\/DL>/gi;
  const stack: string[] = [];
  let pending: string | null = null;
  const groups = new Map<string, { url: string; title: string }[]>();

  for (const m of html.matchAll(token)) {
    const raw = m[0].toUpperCase();
    if (raw.startsWith("<H3")) {
      pending = decode(m[1]).slice(0, 40);
    } else if (raw.startsWith("<DL")) {
      stack.push(pending ?? "");
      pending = null;
    } else if (raw.startsWith("</DL")) {
      stack.pop();
    } else {
      const href = /HREF\s*=\s*"([^"]*)"/i.exec(m[2])?.[1];
      if (!href || !/^https?:\/\//i.test(href)) continue;
      const name = [...stack].reverse().find(Boolean) || fallbackGroup;
      const list = groups.get(name) ?? [];
      list.push({ url: decode(href), title: decode(m[3]).slice(0, 200) });
      groups.set(name, list);
    }
  }
  return { groups: [...groups].map(([name, links]) => ({ name, links })) };
}

export function buildNetscape(groups: Group[], bookmarks: Bookmark[]): string {
  const lines = [
    "<!DOCTYPE NETSCAPE-Bookmark-file-1>",
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    "<TITLE>Bookmarks</TITLE>",
    "<H1>Bookmarks</H1>",
    "<DL><p>",
  ];
  for (const group of groups) {
    const items = bookmarks.filter((b) => b.groupId === group.id);
    if (!items.length) continue;
    lines.push(`    <DT><H3>${encode(group.name)}</H3>`, "    <DL><p>");
    for (const b of items) {
      const added = Math.floor(new Date(b.createdAt).getTime() / 1000);
      lines.push(
        `        <DT><A HREF="${encode(b.url)}" ADD_DATE="${added}">${encode(b.title)}</A>`,
      );
    }
    lines.push("    </DL><p>");
  }
  lines.push("</DL><p>");
  return lines.join("\n");
}

export function downloadFile(filename: string, content: string, type = "text/html") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

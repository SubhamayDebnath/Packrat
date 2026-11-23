import { ApiError, handler, readJson } from "@/lib/server/api";
import { fetchMetadataCached, normalizeUrl } from "@/lib/server/metadata";
import { hit } from "@/lib/server/rate-limit";
import { metadataSchema } from "@/lib/validators";

export const POST = handler({ auth: "user" }, async ({ req, user }) => {
  await hit(`meta:${user.id}`, 60, 60_000);
  const { url } = await readJson(req, metadataSchema);
  const parsed = normalizeUrl(url);
  if (!parsed)
    throw new ApiError(400, "Enter a valid link", { url: "Enter a valid link" });
  const meta = await fetchMetadataCached(parsed);
  return {
    url: meta.url,
    title: meta.title,
    description: meta.description,
    domain: meta.domain,
    favicon: meta.favicon
      ? `data:${meta.favicon.type};base64,${meta.favicon.data.toString("base64")}`
      : null,
  };
});

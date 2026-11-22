import { MAX_HTML_BYTES } from "@/lib/constants";
import { parseHtml } from "@/lib/extract-images";
import { errorResponse } from "@/lib/http";
import { clientKey, rateLimit, rejectIfCrossSite } from "@/lib/rate-limit";
import { assertPublicHttpUrl } from "@/lib/safe-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLACEHOLDER = "https://uploaded.invalid/";

export async function POST(request: Request) {
  const blocked = rejectIfCrossSite(request);
  if (blocked) return blocked;

  if (!rateLimit(`html:${clientKey(request)}`, 20, 60_000)) {
    return Response.json({ error: "Too many requests. Wait a minute and try again." }, { status: 429 });
  }

  let html = "";
  let baseUrl = "";
  try {
    const body = (await request.json()) as { html?: unknown; baseUrl?: unknown };
    html = typeof body.html === "string" ? body.html : "";
    baseUrl = typeof body.baseUrl === "string" ? body.baseUrl.trim() : "";
  } catch {
    return Response.json({ error: "That HTML file could not be read." }, { status: 400 });
  }

  if (!html.includes("<")) {
    return Response.json({ error: "Choose an HTML file." }, { status: 400 });
  }
  if (new TextEncoder().encode(html).byteLength > MAX_HTML_BYTES) {
    return Response.json({ error: "That HTML file is too large." }, { status: 413 });
  }

  try {
    const base = baseUrl ? await assertPublicHttpUrl(baseUrl) : PLACEHOLDER;
    const result = parseHtml(html, base);
    if (!baseUrl) {
      const kept = result.images.filter((image) => {
        if (image.url.startsWith("data:")) return true;
        try {
          return new URL(image.url).hostname !== "uploaded.invalid";
        } catch {
          return false;
        }
      });
      const skippedRelative = result.images.length - kept.length;
      return Response.json({
        ...result,
        sourceUrl: "",
        title: result.title || "Uploaded HTML",
        images: kept,
        note:
          skippedRelative > 0
            ? "Relative image paths were skipped. Add the page URL so those can be loaded."
            : undefined,
      });
    }

    return Response.json({
      ...result,
      sourceUrl: base,
      title: result.title || "Uploaded HTML",
    });
  } catch (error) {
    return errorResponse(error);
  }
}

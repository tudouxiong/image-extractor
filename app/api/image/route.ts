import { fetchRemoteImage } from "@/lib/fetch-image";
import { errorResponse } from "@/lib/http";
import { clientKey, rateLimit, rejectIfCrossSite } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function contentDisposition(filename: string, download: boolean) {
  const ascii = filename.replace(/[^a-zA-Z0-9._-]/g, "_") || "image";
  return `${download ? "attachment" : "inline"}; filename="${ascii}"`;
}

export async function GET(request: Request) {
  const blocked = rejectIfCrossSite(request);
  if (blocked) return blocked;

  if (!rateLimit(`image:${clientKey(request)}`, 120, 60_000)) {
    return Response.json(
      { error: "Too many requests. Wait a minute and try again." },
      { status: 429 },
    );
  }

  const target = new URL(request.url).searchParams.get("url") ?? "";
  const download = new URL(request.url).searchParams.get("download") === "1";
  if (!target) {
    return Response.json({ error: "Missing image URL." }, { status: 400 });
  }

  try {
    const image = await fetchRemoteImage(target);
    const body = new Uint8Array(image.bytes.byteLength);
    body.set(image.bytes);

    return new Response(body, {
      headers: {
        "content-type": image.contentType,
        "content-length": String(body.byteLength),
        "content-disposition": contentDisposition(image.filename, download),
        "cache-control": "private, max-age=300",
        "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'none'; sandbox",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

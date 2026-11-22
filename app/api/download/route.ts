import JSZip from "jszip";
import { MAX_ZIP_BYTES, MAX_ZIP_IMAGES } from "@/lib/constants";
import { fetchRemoteImage } from "@/lib/fetch-image";
import { errorResponse } from "@/lib/http";
import { clientKey, rateLimit, rejectIfCrossSite } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function mapPool<T, R>(items: T[], limit: number, task: (item: T, index: number) => Promise<R>) {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await task(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

export async function POST(request: Request) {
  const blocked = rejectIfCrossSite(request);
  if (blocked) return blocked;

  if (!rateLimit(`download:${clientKey(request)}`, 8, 60_000)) {
    return Response.json(
      { error: "Too many downloads. Wait a minute and try again." },
      { status: 429 },
    );
  }

  let urls: string[] = [];
  try {
    const body = (await request.json()) as { urls?: unknown };
    if (!Array.isArray(body.urls) || body.urls.some((url) => typeof url !== "string")) {
      return Response.json({ error: "Choose images to download." }, { status: 400 });
    }
    urls = [...new Set(body.urls.map((url) => url.trim()).filter(Boolean))];
  } catch {
    return Response.json({ error: "Choose images to download." }, { status: 400 });
  }

  if (urls.length === 0) {
    return Response.json({ error: "Choose images to download." }, { status: 400 });
  }
  if (urls.length > MAX_ZIP_IMAGES) {
    return Response.json(
      { error: `A ZIP can include up to ${MAX_ZIP_IMAGES} images.` },
      { status: 400 },
    );
  }

  try {
    const zip = new JSZip();
    let usedBytes = 0;
    let added = 0;
    let skipped = 0;

    const images = await mapPool(urls, 4, async (url, index) => {
      try {
        return await fetchRemoteImage(url, index);
      } catch (error) {
        console.error("image skipped", error instanceof Error ? error.message : error);
        return null;
      }
    });

    images.forEach((image, index) => {
      if (!image) {
        skipped += 1;
        return;
      }
      if (usedBytes + image.bytes.byteLength > MAX_ZIP_BYTES) {
        skipped += 1;
        return;
      }
      usedBytes += image.bytes.byteLength;
      zip.file(image.filename || `image-${index + 1}.jpg`, image.bytes);
      added += 1;
    });

    if (added === 0) {
      return Response.json({ error: "Those images could not be downloaded." }, { status: 502 });
    }

    const zipped = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    return new Response(Buffer.from(zipped), {
      headers: {
        "content-type": "application/zip",
        "content-disposition": 'attachment; filename="images.zip"',
        "x-image-count": String(added),
        "x-skipped-count": String(skipped),
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

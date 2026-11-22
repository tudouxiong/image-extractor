import { MAX_EXTRACTED_IMAGES, MAX_PAGES, MAX_START_URLS } from "@/lib/constants";
import { extractFromPage } from "@/lib/extract-images";
import { FetchPageError, SafeUrlError } from "@/lib/errors";
import { errorResponse } from "@/lib/http";
import { clientKey, rateLimit, rejectIfCrossSite } from "@/lib/rate-limit";
import type { ExtractedImage } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith("#")) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function pageKey(raw: string) {
  const url = new URL(raw);
  url.hash = "";
  return url.href;
}

export async function POST(request: Request) {
  const blocked = rejectIfCrossSite(request);
  if (blocked) return blocked;

  if (!rateLimit(`many:${clientKey(request)}`, 6, 60_000)) {
    return Response.json({ error: "Too many requests. Wait a minute and try again." }, { status: 429 });
  }

  let seeds: string[] = [];
  let follow = false;
  try {
    const body = (await request.json()) as { urls?: unknown; follow?: unknown };
    follow = body.follow === true;
    if (Array.isArray(body.urls)) {
      const unique = new Set<string>();
      for (const item of body.urls) {
        if (typeof item !== "string") continue;
        const next = normalize(item);
        if (!next || unique.has(next)) continue;
        unique.add(next);
        if (unique.size >= MAX_START_URLS) break;
      }
      seeds = [...unique];
    }
  } catch {
    return Response.json({ error: "Enter at least one webpage URL." }, { status: 400 });
  }

  if (seeds.length === 0) {
    return Response.json({ error: "Enter at least one webpage URL." }, { status: 400 });
  }

  const queue: string[] = [];
  const seenPages = new Set<string>();
  const seenImages = new Set<string>();
  const images: ExtractedImage[] = [];
  let pagesRead = 0;
  let skippedPages = 0;
  let truncated = false;
  let lastError = "Those pages could not be reached.";
  let sawFetchError = false;
  let firstTitle = "";
  let firstUrl = "";

  function enqueue(raw: string) {
    let key = "";
    try {
      key = pageKey(raw);
    } catch {
      return;
    }
    if (seenPages.has(key)) return;
    if (seenPages.size >= MAX_PAGES) return;
    seenPages.add(key);
    queue.push(key);
  }

  for (const seed of seeds) enqueue(seed);

  try {
    while (queue.length > 0 && images.length < MAX_EXTRACTED_IMAGES) {
      const pageUrl = queue.shift();
      if (!pageUrl) break;
      try {
        const result = await extractFromPage(pageUrl, { links: follow });
        pagesRead += 1;
        if (result.sourceUrl) seenPages.add(result.sourceUrl);
        if (!firstUrl) {
          firstUrl = result.sourceUrl;
          firstTitle = result.title;
        }
        for (const image of result.images) {
          if (images.length >= MAX_EXTRACTED_IMAGES) {
            truncated = true;
            break;
          }
          if (seenImages.has(image.url)) continue;
          seenImages.add(image.url);
          images.push(image);
        }
        if (result.truncated) truncated = true;
        if (follow && result.links) {
          for (const link of result.links) enqueue(link);
        }
      } catch (error) {
        skippedPages += 1;
        if (error instanceof FetchPageError || error instanceof SafeUrlError) {
          lastError = error.message;
          if (error instanceof FetchPageError) sawFetchError = true;
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    return errorResponse(error);
  }

  if (pagesRead === 0) {
    return Response.json({ error: lastError }, { status: sawFetchError ? 502 : 400 });
  }

  const note =
    skippedPages > 0
      ? `${skippedPages} ${skippedPages === 1 ? "page" : "pages"} could not be opened.`
      : undefined;

  return Response.json({
    sourceUrl: firstUrl,
    title: pagesRead === 1 ? firstTitle : `Images from ${pagesRead} pages`,
    images,
    truncated,
    note,
  });
}

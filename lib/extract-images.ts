import { load } from "cheerio";
import { MAX_EXTRACTED_IMAGES, MAX_HTML_BYTES } from "@/lib/constants";
import { FetchPageError } from "@/lib/errors";
import { filenameFromUrl } from "@/lib/filename";
import { readLimitedBytes, safeFetch } from "@/lib/safe-fetch";
import type { ExtractedImage, ExtractResult } from "@/lib/types";

const SKIP_NAME =
  /(pixel|spacer|blank|transparent|tracking|beacon|1x1|clear\.gif|spacer\.gif)/i;
const TINY_GIF = "data:image/gif;base64,R0lGODlhAQAB";

function cleanText(value: string, max: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function dimension(value: string | undefined) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveUrl(raw: string | undefined, base: string) {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, "");
  if (
    !trimmed ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("about:")
  ) {
    return null;
  }

  if (trimmed.startsWith("data:image/")) {
    if (trimmed.startsWith(TINY_GIF) || trimmed.length < 200 || trimmed.length > 500_000) return null;
    return trimmed;
  }

  try {
    const url = new URL(trimmed, base);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

function isSkippable(url: string) {
  if (url.startsWith("data:")) return false;
  try {
    return SKIP_NAME.test(decodeURIComponent(new URL(url).pathname));
  } catch {
    return SKIP_NAME.test(url);
  }
}

function largestSrcset(value: string | undefined) {
  if (!value) return null;
  let bestUrl: string | null = null;
  let bestScore = -1;

  for (const part of value.split(",")) {
    const bits = part.trim().split(/\s+/);
    const raw = bits[0];
    if (!raw) continue;
    const descriptor = bits[1] ?? "";
    let score = 1;
    if (descriptor.endsWith("w")) score = Number.parseInt(descriptor, 10) || 1;
    else if (descriptor.endsWith("x")) score = Math.round((Number.parseFloat(descriptor) || 1) * 1000);
    if (score >= bestScore) {
      bestScore = score;
      bestUrl = raw;
    }
  }

  return bestUrl;
}

function isDirectImageUrl(url: string, contentType: string) {
  const type = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (type.startsWith("image/")) return true;
  try {
    return /\.(png|jpe?g|gif|webp|avif|svg|bmp|ico|tiff?)($|\?)/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

function isTiny(image: ExtractedImage) {
  const smallWidth = image.width !== null && image.width > 0 && image.width < 80;
  const smallHeight = image.height !== null && image.height > 0 && image.height < 80;
  return smallWidth || smallHeight;
}

export function parseHtml(html: string, baseUrl: string): ExtractResult {
  const $ = load(html);
  const found: ExtractedImage[] = [];
  const seen = new Set<string>();

  function add(raw: string | undefined | null, alt = "", width: number | null = null, height: number | null = null) {
    const url = resolveUrl(raw ?? undefined, baseUrl);
    if (!url || seen.has(url) || isSkippable(url)) return;
    if (width !== null && height !== null && width <= 2 && height <= 2) return;
    seen.add(url);
    found.push({
      url,
      alt: cleanText(alt, 180),
      width,
      height,
    });
  }

  $("img").each((_, element) => {
    const el = $(element);
    const width = dimension(el.attr("width"));
    const height = dimension(el.attr("height"));
    if (width !== null && height !== null && width <= 2 && height <= 2) return;

    const chosen =
      largestSrcset(el.attr("srcset") || el.attr("data-srcset")) ||
      el.attr("data-src") ||
      el.attr("data-original") ||
      el.attr("data-lazy-src") ||
      el.attr("data-url") ||
      el.attr("src");

    add(chosen, el.attr("alt") ?? "", width, height);
  });

  $("source").each((_, element) => {
    const el = $(element);
    add(largestSrcset(el.attr("srcset") || el.attr("data-srcset")));
  });

  $("meta[property='og:image'], meta[property='og:image:url'], meta[name='twitter:image'], meta[name='twitter:image:src'], link[rel='image_src']").each(
    (_, element) => {
      const el = $(element);
      add(el.attr("content") || el.attr("href"));
    },
  );

  $("[style*='url(']").each((_, element) => {
    const style = $(element).attr("style") ?? "";
    const pattern = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;
    for (const match of style.matchAll(pattern)) {
      const raw = match[2];
      const resolved = resolveUrl(raw, baseUrl);
      if (resolved && (resolved.startsWith("data:image/") || isDirectImageUrl(resolved, ""))) {
        add(raw);
      }
    }
  });

  const main: ExtractedImage[] = [];
  const tiny: ExtractedImage[] = [];
  for (const image of found) {
    (isTiny(image) ? tiny : main).push(image);
  }

  const ordered = [...main, ...tiny];
  const title =
    cleanText($("title").first().text(), 140) ||
    cleanText($("meta[property='og:title']").attr("content") ?? "", 140);

  return {
    sourceUrl: baseUrl,
    title,
    images: ordered.slice(0, MAX_EXTRACTED_IMAGES),
    truncated: ordered.length > MAX_EXTRACTED_IMAGES,
  };
}

const SKIP_LINK = /\.(png|jpe?g|gif|webp|avif|svg|bmp|ico|tiff?|pdf|zip|mp4|webm|css|js|mjs|xml|json|woff2?|ttf)($|\?)/i;

function collectLinks(html: string, baseUrl: string) {
  const $ = load(html);
  let origin = "";
  let baseKey = "";
  try {
    const base = new URL(baseUrl);
    origin = base.origin;
    baseKey = `${base.origin}${base.pathname}${base.search}`;
  } catch {
    return [];
  }

  const links: string[] = [];
  const seen = new Set<string>();

  $("a[href]").each((_, element) => {
    if (links.length >= 30) return;
    const url = resolveUrl($(element).attr("href"), baseUrl);
    if (!url || seen.has(url)) return;
    try {
      const parsed = new URL(url);
      if (parsed.origin !== origin) return;
      if (SKIP_LINK.test(parsed.pathname)) return;
      if (`${parsed.origin}${parsed.pathname}${parsed.search}` === baseKey) return;
    } catch {
      return;
    }
    seen.add(url);
    links.push(url);
  });

  return links;
}

export async function extractFromPage(pageUrl: string, options?: { links?: boolean }): Promise<ExtractResult> {
  const { response, finalUrl } = await safeFetch(pageUrl.trim(), 15_000);
  if (response.status >= 400) {
    await response.body?.cancel();
    throw new FetchPageError(`That page returned an error (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (isDirectImageUrl(finalUrl, contentType)) {
    await response.body?.cancel();
    return {
      sourceUrl: finalUrl,
      title: filenameFromUrl(finalUrl, 0),
      images: [{ url: finalUrl, alt: "", width: null, height: null }],
      truncated: false,
    };
  }

  const type = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  const textual = !type || type.includes("html") || type.includes("xml") || type.startsWith("text/");
  if (!textual) {
    await response.body?.cancel();
    throw new FetchPageError("That URL is not a webpage or an image.");
  }

  const bytes = await readLimitedBytes(response, MAX_HTML_BYTES, "That page is too large to read.");
  const html = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const result = parseHtml(html, finalUrl);
  if (options?.links) result.links = collectLinks(html, finalUrl);
  return result;
}

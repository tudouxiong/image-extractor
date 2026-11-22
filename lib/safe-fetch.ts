import { FetchPageError, SafeUrlError } from "@/lib/errors";
import { assertPublicHttpUrl } from "@/lib/safe-url";

const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
};

export async function safeFetch(target: string, timeoutMs = 15_000) {
  let current = await assertPublicHttpUrl(target);
  const seen = new Set<string>();

  for (let hop = 0; hop < 5; hop += 1) {
    if (seen.has(current)) {
      throw new FetchPageError("That page redirected too many times.");
    }
    seen.add(current);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        cache: "no-store",
        headers: HEADERS,
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (!location) throw new FetchPageError("That page could not be reached.");
        current = await assertPublicHttpUrl(new URL(location, current).href);
        continue;
      }

      return { response, finalUrl: current };
    } catch (error) {
      if (error instanceof SafeUrlError || error instanceof FetchPageError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new FetchPageError("That page took too long to respond.");
      }
      throw new FetchPageError("That page could not be reached.");
    } finally {
      clearTimeout(timer);
    }
  }

  throw new FetchPageError("That page redirected too many times.");
}

export async function readLimitedBytes(
  response: Response,
  maxBytes: number,
  tooLargeMessage: string,
) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body?.cancel();
    throw new FetchPageError(tooLargeMessage);
  }

  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new FetchPageError(tooLargeMessage);
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

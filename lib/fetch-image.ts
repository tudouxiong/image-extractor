import { MAX_IMAGE_BYTES } from "@/lib/constants";
import { FetchPageError } from "@/lib/errors";
import { filenameFromUrl } from "@/lib/filename";
import { readLimitedBytes, safeFetch } from "@/lib/safe-fetch";
import { classifyImage } from "@/lib/sniff-image";

export type RemoteImage = {
  bytes: Uint8Array;
  contentType: string;
  filename: string;
};

function decodeDataImage(url: string, index: number): RemoteImage {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+)?(;base64)?,([\s\S]*)$/.exec(url);
  if (!match || url.length > 1_500_000) {
    throw new FetchPageError("That image could not be downloaded.");
  }

  const contentType = match[1] || "image/png";
  const payload = match[3] ?? "";
  const bytes = match[2]
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");

  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new FetchPageError("That image is too large to download.");
  }

  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return {
    bytes: copy,
    contentType,
    filename: filenameFromUrl(url, index),
  };
}

export async function fetchRemoteImage(target: string, index = 0): Promise<RemoteImage> {
  if (target.startsWith("data:image/")) return decodeDataImage(target, index);

  const { response, finalUrl } = await safeFetch(target, 12_000);
  if (response.status >= 400) {
    await response.body?.cancel();
    throw new FetchPageError("That image could not be downloaded.");
  }

  const bytes = await readLimitedBytes(
    response,
    MAX_IMAGE_BYTES,
    "That image is too large to download.",
  );
  const contentType = classifyImage(bytes, response.headers.get("content-type") ?? "", finalUrl);
  if (!contentType) throw new FetchPageError("That image could not be downloaded.");

  return {
    bytes,
    contentType,
    filename: filenameFromUrl(finalUrl, index),
  };
}

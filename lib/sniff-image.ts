export function sniffImage(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (brand.startsWith("avi")) return "image/avif";
    if (brand === "heic" || brand === "heix" || brand === "mif1") return "image/heic";
  }
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) return "image/bmp";
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x00 &&
    bytes[1] === 0x00 &&
    bytes[2] === 0x01 &&
    bytes[3] === 0x00
  ) {
    return "image/x-icon";
  }
  return null;
}

export function looksLikeSvg(bytes: Uint8Array) {
  const head = new TextDecoder().decode(bytes.subarray(0, 400)).trim().toLowerCase();
  return head.includes("<svg") && !head.includes("<html") && !head.includes("<!doctype html");
}

export function looksLikeHtml(bytes: Uint8Array) {
  const head = new TextDecoder().decode(bytes.subarray(0, 240)).trim().toLowerCase();
  return (
    head.startsWith("<!doctype html") ||
    head.startsWith("<html") ||
    head.startsWith("<head") ||
    head.startsWith("<script")
  );
}

export function classifyImage(bytes: Uint8Array, contentType: string, url: string) {
  const sniffed = sniffImage(bytes);
  if (sniffed) return sniffed;

  if (looksLikeSvg(bytes)) return "image/svg+xml";

  const declared = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (declared.startsWith("image/") && !looksLikeHtml(bytes)) return declared;

  try {
    if (/\.svg$/i.test(new URL(url).pathname) && !looksLikeHtml(bytes)) return "image/svg+xml";
  } catch {
    return null;
  }

  return null;
}

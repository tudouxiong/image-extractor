export function filenameFromImage(url: string, alt: string, index = 0) {
  if ((url.startsWith("blob:") || url.startsWith("data:")) && /\.[a-z0-9]{2,5}$/i.test(alt)) {
    const prefix = String(index + 1).padStart(2, "0");
    const clean = alt.replace(/[^a-zA-Z0-9._-]/g, "").slice(-70);
    if (clean.includes(".")) return `${prefix}-${clean}`;
  }
  return filenameFromUrl(url, index);
}

export function filenameFromUrl(url: string, index = 0) {
  const prefix = String(index + 1).padStart(2, "0");

  if (url.startsWith("data:image/")) {
    const match = /^data:image\/([a-zA-Z0-9.+-]+)/.exec(url);
    const subtype = match?.[1]?.toLowerCase() ?? "img";
    const ext = subtype.replace("jpeg", "jpg").replace("svg+xml", "svg");
    return `${prefix}-image.${ext}`;
  }

  try {
    const base = decodeURIComponent(new URL(url).pathname.split("/").pop() || "");
    const clean = base.replace(/[^a-zA-Z0-9._-]/g, "").slice(-60);
    if (clean.includes(".")) return `${prefix}-${clean}`;
    if (/^(png|jpe?g|gif|webp|avif|svg|bmp|ico)$/i.test(clean)) {
      return `${prefix}-image.${clean.toLowerCase()}`;
    }
  } catch {
    return `${prefix}-image.jpg`;
  }

  return `${prefix}-image.jpg`;
}

export function displaySrc(url: string) {
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  return `/api/image?url=${encodeURIComponent(url)}`;
}

export function downloadHref(url: string) {
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  return `/api/image?url=${encodeURIComponent(url)}&download=1`;
}

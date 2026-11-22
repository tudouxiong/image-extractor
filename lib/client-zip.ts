import JSZip from "jszip";
import { filenameFromImage } from "@/lib/filename";
import { displaySrc } from "@/lib/image-src";
import type { ExtractedImage } from "@/lib/types";

export async function zipImages(images: ExtractedImage[]) {
  const zip = new JSZip();
  const used = new Set<string>();
  let saved = 0;
  let skipped = 0;

  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    if (!image) continue;
    try {
      const response = await fetch(displaySrc(image.url));
      if (!response.ok) {
        skipped += 1;
        continue;
      }
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength < 32) {
        skipped += 1;
        continue;
      }
      let name = filenameFromImage(image.url, image.alt, index);
      while (used.has(name)) name = `copy-${name}`;
      used.add(name);
      zip.file(name, bytes);
      saved += 1;
    } catch {
      skipped += 1;
    }
  }

  if (saved === 0) throw new Error("Could not build the ZIP.");
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  return { blob, saved, skipped };
}

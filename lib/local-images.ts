import { MAX_LOCAL_IMAGES } from "@/lib/constants";
import type { ExtractedImage } from "@/lib/types";

function isImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|avif|bmp|svg|ico|tiff?)$/i.test(file.name);
}

export function imagesFromLocalFiles(files: File[]) {
  const images: ExtractedImage[] = [];
  for (const file of files) {
    if (!isImageFile(file)) continue;
    if (images.length >= MAX_LOCAL_IMAGES) break;
    images.push({
      url: URL.createObjectURL(file),
      alt: file.name,
      width: null,
      height: null,
    });
  }
  return {
    images,
    truncated: files.filter(isImageFile).length > MAX_LOCAL_IMAGES,
  };
}

import { ImageResponse } from "next/og";
import { OgCard, ogContentType, ogSize } from "@/lib/og-card";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Image Extractor, a free tool to download images from a public page";

export default function OpenGraphImage() {
  return new ImageResponse(<OgCard />, size);
}

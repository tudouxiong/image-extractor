"use client";

import { filenameFromImage } from "@/lib/filename";
import { displaySrc, downloadHref } from "@/lib/image-src";
import type { ExtractedImage } from "@/lib/types";
import { useState } from "react";

function metaLine(image: ExtractedImage) {
  if (image.width && image.height) return `${image.width} × ${image.height}`;
  if (image.url.startsWith("data:")) return "Embedded image";
  if (image.url.startsWith("blob:")) return image.alt || "On this computer";
  try {
    return new URL(image.url).hostname.replace(/^www\./, "");
  } catch {
    return "Image";
  }
}

export function ImageGrid({
  images,
  selected,
  onToggle,
  onPreview,
}: {
  images: ExtractedImage[];
  selected: Set<string>;
  onToggle: (url: string) => void;
  onPreview: (index: number) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {images.map((image, index) => (
        <ImageCard
          key={image.url}
          image={image}
          index={index}
          selected={selected.has(image.url)}
          onToggle={onToggle}
          onPreview={onPreview}
        />
      ))}
    </ul>
  );
}

function ImageCard({
  image,
  index,
  selected,
  onToggle,
  onPreview,
}: {
  image: ExtractedImage;
  index: number;
  selected: boolean;
  onToggle: (url: string) => void;
  onPreview: (index: number) => void;
}) {
  const [failed, setFailed] = useState(false);
  const name = filenameFromImage(image.url, image.alt, index);
  const label = image.alt || name;

  return (
    <li
      className={`overflow-hidden rounded-xl border bg-card ${
        selected ? "border-accent ring-2 ring-accent" : "border-line"
      }`}
    >
      <div className="relative">
        <label className="absolute top-2 left-2 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-sm">
          <input
            type="checkbox"
            className="h-5 w-5 accent-accent"
            checked={selected}
            aria-label={`Select ${label}`}
            onChange={() => onToggle(image.url)}
          />
        </label>
        <button
          type="button"
          className="checker block aspect-square w-full"
          onClick={() => onPreview(index)}
          aria-label={`Preview ${label}`}
        >
          {failed ? (
            <span className="flex h-full items-center justify-center px-4 text-center text-xs text-muted">
              Preview unavailable
            </span>
          ) : (
            // Remote pages are arbitrary, so the browser loads them through our image proxy.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displaySrc(image.url)}
              alt={image.alt || name}
              className="h-full w-full object-contain"
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
            />
          )}
        </button>
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-xs text-foreground" title={label}>
            {label}
          </p>
          <p className="truncate text-xs text-muted">{metaLine(image)}</p>
        </div>
        <a
          href={downloadHref(image.url)}
          download={name}
          className="inline-flex h-11 shrink-0 items-center px-1 text-xs font-semibold text-accent hover:underline"
        >
          Save
        </a>
      </div>
    </li>
  );
}

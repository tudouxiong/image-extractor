"use client";

import { filenameFromImage } from "@/lib/filename";
import { displaySrc, downloadHref } from "@/lib/image-src";
import type { ExtractedImage } from "@/lib/types";
import { useEffect, useState } from "react";

export function PreviewModal({
  image,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  image: ExtractedImage;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const name = filenameFromImage(image.url, image.alt, index);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onNext();
      if (event.key === "ArrowLeft") onPrev();
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, onNext, onPrev]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p id="preview-title" className="truncate text-sm font-semibold">
              {image.alt || name}
            </p>
            <p className="text-xs text-muted">
              {index + 1} of {total}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 shrink-0 items-center rounded-lg border border-line px-4 text-sm"
          >
            Close
          </button>
        </div>
        <div className="checker flex min-h-64 flex-1 items-center justify-center p-4 sm:p-8">
          {failed ? (
            <p className="max-w-sm text-center text-sm text-muted">
              This image could not be previewed. You can still try downloading it.
            </p>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displaySrc(image.url)}
              alt={image.alt || name}
              className="max-h-[48vh] max-w-full object-contain sm:max-h-[68vh]"
              onError={() => setFailed(true)}
            />
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onPrev}
              disabled={total < 2}
              className="inline-flex h-11 items-center rounded-lg border border-line px-4 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={total < 2}
              className="inline-flex h-11 items-center rounded-lg border border-line px-4 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
          <a
            href={downloadHref(image.url)}
            download={name}
            className="inline-flex h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white"
          >
            Save image
          </a>
        </div>
      </div>
    </div>
  );
}

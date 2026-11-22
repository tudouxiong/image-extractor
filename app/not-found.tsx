import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Page not found · Image Extractor" },
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-semibold tracking-wide text-accent">404</p>
      <h1 className="mt-3 font-display text-4xl">Page not found</h1>
      <p className="mt-3 text-muted">That page is not part of Image Extractor.</p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center rounded-xl bg-accent px-6 text-sm font-semibold text-white"
      >
        Back to the extractor
      </Link>
    </div>
  );
}

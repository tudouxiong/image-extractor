"use client";

import { ImageGrid } from "@/components/image-grid";
import { PreviewModal } from "@/components/preview-modal";
import { MAX_HTML_BYTES, MAX_START_URLS, MAX_ZIP_IMAGES } from "@/lib/constants";
import { imagesFromLocalFiles } from "@/lib/local-images";
import type { ExtractResult } from "@/lib/types";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const SAMPLE_URL = "https://www.cloudflare.com/";

type Source = "page" | "pages" | "html" | "document" | "local";

const SOURCES: { id: Source; label: string }[] = [
  { id: "page", label: "Webpage" },
  { id: "pages", label: "Several pages" },
  { id: "html", label: "HTML file" },
  { id: "document", label: "PDF / Word / PPT" },
  { id: "local", label: "Local images" },
];

const BUSY: Record<Source, string> = {
  page: "Reading the page…",
  pages: "Reading the pages…",
  html: "Reading the HTML…",
  document: "Reading the file…",
  local: "Reading the files…",
};

function pageHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function normalizeInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function emptyCopy(source: Source) {
  if (source === "html") {
    return "This HTML has no images we can load. Add the page URL if the pictures use relative paths.";
  }
  if (source === "document") {
    return "No pictures were embedded in that file. Older .doc and .ppt files need to be saved as .docx or .pptx first.";
  }
  if (source === "local") {
    return "None of the selected files were images.";
  }
  return "These pages have no images in their HTML. Pictures loaded only after login, scrolling, or JavaScript will not appear.";
}

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error || fallback;
}

function saveBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export function Extractor() {
  const [source, setSource] = useState<Source>("page");
  const [url, setUrl] = useState("");
  const [pagesText, setPagesText] = useState("");
  const [follow, setFollow] = useState(false);
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [htmlBase, setHtmlBase] = useState("");
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const blobUrls = useRef<string[]>([]);

  const images = result?.images ?? [];

  useEffect(() => {
    const urls = blobUrls;
    return () => {
      for (const objectUrl of urls.current) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  function begin() {
    for (const objectUrl of blobUrls.current) URL.revokeObjectURL(objectUrl);
    blobUrls.current = [];
    setStatus("loading");
    setError("");
    setNotice("");
    setResult(null);
    setSelected(new Set());
    setPreviewIndex(null);
  }

  function finish(data: ExtractResult) {
    blobUrls.current = data.images.filter((image) => image.url.startsWith("blob:")).map((image) => image.url);
    setResult(data);
    setNotice(data.note ?? "");
    setStatus("done");
  }

  function fail(message: string) {
    setError(message);
    setStatus((current) => (current === "done" ? "done" : "error"));
  }

  async function run(rawValue?: string) {
    if (source === "page") {
      const nextUrl = normalizeInput(rawValue ?? url);
      if (rawValue) setUrl(rawValue);
      if (!nextUrl) {
        fail("Enter a webpage URL.");
        return;
      }
      begin();
      try {
        const response = await fetch("/api/extract", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: nextUrl }),
        });
        if (!response.ok) throw new Error(await readError(response, "Could not extract images. Try again."));
        finish((await response.json()) as ExtractResult);
      } catch (extractError) {
        fail(extractError instanceof Error ? extractError.message : "Could not extract images. Try again.");
      }
      return;
    }

    if (source === "pages") {
      const lines = pagesText
        .split(/\r?\n/)
        .map((line) => normalizeInput(line))
        .filter(Boolean);
      const unique = [...new Set(lines)];
      if (unique.length === 0) {
        fail("Enter at least one webpage URL.");
        return;
      }
      const urls = unique.slice(0, MAX_START_URLS);
      begin();
      try {
        const response = await fetch("/api/extract-many", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ urls, follow }),
        });
        if (!response.ok) throw new Error(await readError(response, "Could not extract images. Try again."));
        const data = (await response.json()) as ExtractResult;
        if (unique.length > urls.length) {
          const extra = `Only the first ${MAX_START_URLS} addresses were used.`;
          data.note = data.note ? `${data.note} ${extra}` : extra;
        }
        finish(data);
      } catch (extractError) {
        fail(extractError instanceof Error ? extractError.message : "Could not extract images. Try again.");
      }
      return;
    }

    if (source === "html") {
      if (!htmlFile) {
        fail("Choose an HTML file.");
        return;
      }
      if (htmlFile.size > MAX_HTML_BYTES) {
        fail("That HTML file is too large.");
        return;
      }
      begin();
      try {
        const html = await htmlFile.text();
        const response = await fetch("/api/extract-html", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ html, baseUrl: normalizeInput(htmlBase) }),
        });
        if (!response.ok) throw new Error(await readError(response, "Could not read that HTML file."));
        const data = (await response.json()) as ExtractResult;
        if (!data.title) data.title = htmlFile.name;
        finish(data);
      } catch (extractError) {
        fail(extractError instanceof Error ? extractError.message : "Could not read that HTML file.");
      }
      return;
    }

    if (source === "document") {
      if (documentFiles.length === 0) {
        fail("Choose a PDF, Word, or PowerPoint file.");
        return;
      }
      begin();
      try {
        const { imagesFromDocuments } = await import("@/lib/open-files");
        const extracted = await imagesFromDocuments(documentFiles);
        if (extracted.images.length === 0) {
          fail(extracted.notes[0] || "No images found in that file.");
          return;
        }
        const first = documentFiles[0];
        finish({
          sourceUrl: "",
          title: documentFiles.length === 1 && first ? first.name : `${documentFiles.length} files`,
          images: extracted.images,
          truncated: false,
          note: extracted.notes.join(" ") || undefined,
        });
      } catch {
        fail("Could not read that file.");
      }
      return;
    }

    if (localFiles.length === 0) {
      fail("Choose image files, or a folder of images.");
      return;
    }
    begin();
    const extracted = imagesFromLocalFiles(localFiles);
    if (extracted.images.length === 0) {
      fail("None of the selected files were images.");
      return;
    }
    finish({
      sourceUrl: "",
      title: "Local images",
      images: extracted.images,
      truncated: false,
      note: extracted.truncated ? "Showing the first 200 images." : undefined,
    });
  }

  function toggle(imageUrl: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(imageUrl)) next.delete(imageUrl);
      else next.add(imageUrl);
      return next;
    });
  }

  function toggleAll() {
    setSelected((current) => {
      if (current.size === images.length) return new Set();
      return new Set(images.map((image) => image.url));
    });
  }

  const closePreview = useCallback(() => setPreviewIndex(null), []);
  const showPrev = useCallback(() => {
    setPreviewIndex((current) => {
      if (current === null || images.length === 0) return current;
      return (current - 1 + images.length) % images.length;
    });
  }, [images.length]);
  const showNext = useCallback(() => {
    setPreviewIndex((current) => {
      if (current === null || images.length === 0) return current;
      return (current + 1) % images.length;
    });
  }, [images.length]);

  async function downloadZip() {
    const chosen = images.filter((image) => selected.has(image.url));
    const sourceImages = (chosen.length > 0 ? chosen : images).slice(0, MAX_ZIP_IMAGES);
    if (sourceImages.length === 0) return;

    setDownloading(true);
    setNotice("");
    setError("");

    try {
      const remote = sourceImages.every((image) => /^https?:/i.test(image.url));
      if (remote) {
        const response = await fetch("/api/download", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ urls: sourceImages.map((image) => image.url) }),
        });
        if (!response.ok) throw new Error(await readError(response, "Could not build the ZIP."));
        saveBlob(await response.blob(), "images.zip");
        const saved = Number(response.headers.get("x-image-count") ?? sourceImages.length);
        const skipped = Number(response.headers.get("x-skipped-count") ?? "0");
        const parts = [`Downloaded ${saved} ${saved === 1 ? "image" : "images"}.`];
        if (skipped > 0) parts.push(`${skipped} could not be fetched.`);
        if (chosen.length > sourceImages.length || (chosen.length === 0 && images.length > sourceImages.length)) {
          parts.push(`Only the first ${MAX_ZIP_IMAGES} images were added.`);
        }
        setNotice(parts.join(" "));
      } else {
        const { zipImages } = await import("@/lib/client-zip");
        const zipped = await zipImages(sourceImages);
        saveBlob(zipped.blob, "images.zip");
        const parts = [`Downloaded ${zipped.saved} ${zipped.saved === 1 ? "image" : "images"}.`];
        if (zipped.skipped > 0) parts.push(`${zipped.skipped} could not be added.`);
        if ((chosen.length > 0 ? chosen.length : images.length) > sourceImages.length) {
          parts.push(`Only the first ${MAX_ZIP_IMAGES} images were added.`);
        }
        setNotice(parts.join(" "));
      }
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Could not build the ZIP.");
    } finally {
      setDownloading(false);
    }
  }

  const preview = previewIndex === null ? null : images[previewIndex];
  const downloadLabel = selected.size > 0 ? `Download ${Math.min(selected.size, MAX_ZIP_IMAGES)}` : "Download ZIP";

  return (
    <section className="mt-10 w-full" aria-busy={status === "loading"}>
      <form
        className="mx-auto max-w-3xl rounded-2xl border border-line bg-card p-3 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] sm:p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void run();
        }}
      >
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Image source">
          {SOURCES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={source === item.id}
              onClick={() => {
                setSource(item.id);
                setError("");
                setStatus((current) => (current === "error" ? "idle" : current));
              }}
              className={`inline-flex h-11 shrink-0 items-center rounded-lg px-3 text-sm ${
                source === item.id ? "bg-accent text-white" : "border border-line bg-white text-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {source === "page" ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="page-url">
              Webpage URL
            </label>
            <input
              id="page-url"
              name="url"
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              maxLength={2000}
              placeholder="https://example.com"
              value={url}
              disabled={status === "loading"}
              aria-invalid={status === "error"}
              onChange={(event) => setUrl(event.target.value)}
              className="h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none placeholder:text-slate-400 focus:border-accent"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-white transition hover:bg-[#1e3a8a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? "Extracting…" : "Extract Images"}
            </button>
          </div>
        ) : null}

        {source === "pages" ? (
          <div className="space-y-3">
            <label className="sr-only" htmlFor="page-urls">
              Webpage URLs, one per line
            </label>
            <textarea
              id="page-urls"
              rows={5}
              spellCheck={false}
              maxLength={8000}
              placeholder={"https://example.com/one\nhttps://example.com/two"}
              value={pagesText}
              disabled={status === "loading"}
              onChange={(event) => setPagesText(event.target.value)}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none placeholder:text-slate-400 focus:border-accent"
            />
            <label className="flex items-center gap-2 px-1 text-sm text-foreground">
              <input
                type="checkbox"
                checked={follow}
                disabled={status === "loading"}
                onChange={(event) => setFollow(event.target.checked)}
                className="accent-accent"
              />
              Also open links on the same site (up to 8 pages)
            </label>
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-white hover:bg-[#1e3a8a] disabled:opacity-60"
            >
              {status === "loading" ? "Extracting…" : "Extract Images"}
            </button>
          </div>
        ) : null}

        {source === "html" ? (
          <div className="space-y-3">
            <label className="block text-sm text-muted" htmlFor="html-file">
              HTML file
              <input
                id="html-file"
                type="file"
                accept=".html,.htm,text/html"
                disabled={status === "loading"}
                onChange={(event) => setHtmlFile(event.target.files?.[0] ?? null)}
                className="mt-2 block w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </label>
            <label className="sr-only" htmlFor="html-base">
              Page URL for relative images
            </label>
            <input
              id="html-base"
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              maxLength={2000}
              placeholder="Optional page URL, so relative images can load"
              value={htmlBase}
              disabled={status === "loading"}
              onChange={(event) => setHtmlBase(event.target.value)}
              className="h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none placeholder:text-slate-400 focus:border-accent"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-white hover:bg-[#1e3a8a] disabled:opacity-60"
            >
              {status === "loading" ? "Extracting…" : "Extract Images"}
            </button>
          </div>
        ) : null}

        {source === "document" ? (
          <div className="space-y-3">
            <label className="block text-sm text-muted" htmlFor="document-file">
              PDF, Word, or PowerPoint
              <input
                id="document-file"
                type="file"
                accept=".pdf,.docx,.pptx,application/pdf"
                multiple
                disabled={status === "loading"}
                onChange={(event) => setDocumentFiles(event.target.files ? Array.from(event.target.files) : [])}
                className="mt-2 block w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </label>
            <p className="px-1 text-xs text-muted">
              {documentFiles.length > 0
                ? `${documentFiles.length} ${documentFiles.length === 1 ? "file" : "files"} selected. Files stay on this computer.`
                : "Use .pdf, .docx, or .pptx. Files stay on this computer."}
            </p>
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-white hover:bg-[#1e3a8a] disabled:opacity-60"
            >
              {status === "loading" ? "Extracting…" : "Extract Images"}
            </button>
          </div>
        ) : null}

        {source === "local" ? (
          <div className="space-y-3">
            <label className="block text-sm text-muted" htmlFor="local-images">
              Image files
              <input
                id="local-images"
                type="file"
                accept="image/*"
                multiple
                disabled={status === "loading"}
                onChange={(event) => setLocalFiles(event.target.files ? Array.from(event.target.files) : [])}
                className="mt-2 block w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </label>
            <label className="block text-sm text-muted" htmlFor="local-folder">
              Or a folder
              <input
                id="local-folder"
                type="file"
                accept="image/*"
                multiple
                disabled={status === "loading"}
                onChange={(event) => setLocalFiles(event.target.files ? Array.from(event.target.files) : [])}
                className="mt-2 block w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                {...({ webkitdirectory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
              />
            </label>
            <p className="px-1 text-xs text-muted">
              {localFiles.length > 0
                ? `${localFiles.length} ${localFiles.length === 1 ? "file" : "files"} selected. Pictures stay on this computer.`
                : "Up to 200 pictures. They stay on this computer."}
            </p>
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-white hover:bg-[#1e3a8a] disabled:opacity-60"
            >
              {status === "loading" ? "Extracting…" : "Extract Images"}
            </button>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-3 text-sm text-muted">
          <p>Free · No signup · Files you pick stay in the browser</p>
          {source === "page" ? (
            <button
              type="button"
              className="font-medium text-foreground underline-offset-4 hover:underline"
              onClick={() => void run(SAMPLE_URL)}
              disabled={status === "loading"}
            >
              Try a sample page
            </button>
          ) : (
            <span>Up to {source === "pages" ? "8 pages" : "200 local images"}</span>
          )}
        </div>
      </form>

      {error && status !== "done" ? (
        <p role="alert" className="mx-auto mt-4 max-w-3xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <p className="sr-only" role="status">
        {status === "loading" ? BUSY[source] : ""}
      </p>

      {status === "loading" ? (
        <div className="mt-8">
          <p className="text-sm text-muted">{BUSY[source]}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-hidden>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="aspect-square animate-pulse rounded-2xl bg-[#e2e8f0]" />
            ))}
          </div>
        </div>
      ) : null}

      {status === "done" && result && images.length === 0 ? (
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-line bg-card px-6 py-10 text-center">
          <h2 className="font-display text-3xl">No images found</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{result.note || emptyCopy(source)}</p>
        </div>
      ) : null}

      {status === "done" && images.length > 0 && result ? (
        <div className="mt-8">
          <div className="sticky top-[calc(4.125rem+env(safe-area-inset-top))] z-30 mb-4 border-b border-line bg-background/95 py-3 backdrop-blur">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-2xl tracking-tight sm:text-3xl">
                  {images.length} {images.length === 1 ? "image" : "images"}
                </h2>
                <p className="mt-1 max-w-xl truncate text-sm text-muted">
                  {result.sourceUrl.startsWith("http") ? (
                    <a href={result.sourceUrl} target="_blank" rel="noreferrer" className="hover:underline">
                      {pageHost(result.sourceUrl)}
                    </a>
                  ) : (
                    <span>{result.title || "Your files"}</span>
                  )}
                  {result.sourceUrl.startsWith("http") && result.title ? ` · ${result.title}` : ""}
                </p>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <button type="button" onClick={toggleAll} className="h-11 flex-1 rounded-xl border border-line bg-card px-4 text-sm sm:flex-none">
                  {selected.size === images.length ? "Clear" : "Select all"}
                </button>
                <button
                  type="button"
                  onClick={() => void downloadZip()}
                  disabled={downloading}
                  className="h-11 flex-1 rounded-xl bg-accent px-4 text-sm font-semibold text-white hover:bg-[#1e3a8a] disabled:opacity-60 sm:flex-none"
                >
                  {downloading ? "Preparing ZIP…" : downloadLabel}
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">
              {selected.size > 0 ? `${selected.size} selected. ` : "Nothing selected, so ZIP includes the set. "}
              Up to {MAX_ZIP_IMAGES} images per ZIP.
              {result.truncated ? " Showing the first 150 images." : ""}
            </p>
            {notice ? <p className="mt-2 text-sm text-foreground">{notice}</p> : null}
            {error ? (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
          </div>
          <ImageGrid images={images} selected={selected} onToggle={toggle} onPreview={setPreviewIndex} />
        </div>
      ) : null}

      {status === "idle" ? (
        <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-muted">
          New here? Read the{" "}
          <Link href="/how-to-use" className="font-medium text-foreground underline-offset-4 hover:underline">
            guide
          </Link>
          .
        </p>
      ) : null}

      {preview && previewIndex !== null ? (
        <PreviewModal
          key={preview.url}
          image={preview}
          index={previewIndex}
          total={images.length}
          onClose={closePreview}
          onPrev={showPrev}
          onNext={showNext}
        />
      ) : null}
    </section>
  );
}

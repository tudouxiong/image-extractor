export const siteName = "Image Extractor";
export const updatedLabel = "November 22, 2026";

const productionUrl = "https://www.imageextractor.site";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) {
    try {
      const host = new URL(configured).hostname;
      if (host === "www.imageextractor.site" || host === "imageextractor.site") return configured;
    } catch {
      // Ignore an invalid override and keep the public domain.
    }
  }
  return productionUrl;
}

export const pages = {
  home: {
    path: "/",
    title: "Image Extractor - Download Images from Any Page Free",
    description:
      "Extract images from a public webpage, HTML file, PDF, or PowerPoint. Preview the pictures and download a ZIP. Free image extractor with no signup. Try it now.",
  },
  howTo: {
    path: "/how-to-use",
    title: "How to Use Image Extractor on a Page, File, or PDF",
    description:
      "Use Image Extractor on a page, several pages, an HTML file, a PDF, Word, PowerPoint, or local pictures. Preview the set and download a ZIP. Free, no signup.",
  },
  faq: {
    path: "/faq",
    title: "Image Extractor FAQ - A Free Tool, No Signup Needed",
    description:
      "Answers about this free image extractor: which files work, why pictures are missing, download limits, and privacy. No account required. Read the FAQ and try it.",
  },
  about: {
    path: "/about",
    title: "About Image Extractor - A Free Image Download Tool",
    description:
      "Image Extractor is a free tool for saving pictures from public pages and from files you already have. No signup and no library. See what it is for, then try it.",
  },
} as const;

import type { MetadataRoute } from "next";
import { getSiteUrl, pages } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date("2026-11-22");
  return [
    { url: `${base}${pages.home.path}`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}${pages.howTo.path}`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}${pages.faq.path}`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}${pages.about.path}`, lastModified, changeFrequency: "yearly", priority: 0.4 },
  ];
}

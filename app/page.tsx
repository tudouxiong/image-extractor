import { Extractor } from "@/components/extractor";
import { FeatureGrid } from "@/components/feature-grid";
import { HomeSections } from "@/components/home-sections";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata } from "@/lib/metadata";
import { getSiteUrl, pages } from "@/lib/site";

export const metadata = pageMetadata(pages.home);

export default function HomePage() {
  const url = `${getSiteUrl()}${pages.home.path}`;
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Image Extractor",
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Web",
          url,
          description: pages.home.description,
          offers: { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        }}
      />
      <section className="mx-auto max-w-3xl pt-10 text-center sm:pt-20">
        <p className="text-sm font-semibold tracking-wide text-accent">Free · No signup · Fast</p>
        <h1 className="mt-4 font-display text-3xl leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Free image extractor for pages and files
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          This image extractor pulls pictures from a public webpage, several pages, an HTML file, a PDF, Word, or
          PowerPoint file, or pictures already on your computer. Preview them, then download a ZIP. No signup.
        </p>
      </section>
      <Extractor />
      <FeatureGrid />
      <HomeSections />
    </div>
  );
}

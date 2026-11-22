import Link from "next/link";
import { UpdatedNote } from "@/components/updated-note";

const CASES = [
  {
    title: "Articles and galleries",
    body: "A public article or gallery often spreads pictures across a long page. An image extractor lists them in one place so you can preview the set and keep the ones you want.",
  },
  {
    title: "Product and catalog pages",
    body: "Product photos, color swatches, and thumbnails usually live in the page HTML. Paste the product URL and download the pictures together instead of saving them one by one.",
  },
  {
    title: "Files you already have",
    body: "A PDF, a Word file, a PowerPoint deck, or a folder of pictures on your computer can be read in the browser. Those files are not uploaded.",
  },
];

export function HomeSections() {
  return (
    <div className="mx-auto mt-20 max-w-3xl space-y-12 text-sm leading-relaxed text-muted">
      <section>
        <h2 className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">What this image extractor does</h2>
        <p className="mt-3">
          An image extractor reads a public page, or a file you choose, and lists the pictures it can find. You
          preview them, select the ones you want, and download a single image or a ZIP of up to 40. There is no
          account, no trial, and no library of saved files. You can try a sample page first, then paste your own
          public address when you want the real set.
        </p>
        <p className="mt-3">
          On a webpage it looks at img tags, srcset, picture sources, Open Graph and Twitter card images, and CSS
          backgrounds that point at an image file. A direct image URL returns that one file. Several pages can
          follow links on the same site, up to 8 pages in total. The result is a list you can scan, not a pile of
          separate downloads.
        </p>
        <p className="mt-3">
          This image extractor is for a set of pictures that already exist in the page or the file. It is a poor fit
          if you need one icon from a design app, or a picture that only appears after you log in. For the walkthrough,
          use the{" "}
          <Link href="/how-to-use" className="font-medium text-foreground underline-offset-4 hover:underline">
            step-by-step guide
          </Link>
          .
        </p>
      </section>
      <section>
        <h2 className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">Where you can extract images from</h2>
        <p className="mt-3">
          Reach for this image extractor when the pictures already sit in a public page or in a file you can open.
        </p>
        <ul className="mt-4 space-y-3">
          {CASES.map((item) => (
            <li key={item.title} className="rounded-2xl border border-line bg-card p-5">
              <h3 className="font-display text-xl tracking-tight text-foreground">{item.title}</h3>
              <p className="mt-2">{item.body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          For Word and PowerPoint, use .docx and .pptx. An older .doc or .ppt file needs to be saved in the newer
          format first. An HTML file can take the original page URL so relative image paths still load. A folder of
          pictures is read on this computer, and the list stops at 200 images.
        </p>
      </section>
      <section>
        <h2 className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">A page and a file are not handled the same way</h2>
        <p className="mt-3">
          When you paste an address, the image extractor requests that public page and reads the HTML that comes back.
          Each picture is then loaded so the preview can be shown. That visit is temporary. The page is not stored as
          an account library, and the pictures are not kept after you leave.
        </p>
        <p className="mt-3">
          A file you pick is not uploaded. The image extractor reads a PDF, a Word file, a PowerPoint file, and
          pictures already on your computer in the browser. An HTML file is the
          exception, because its text has to be parsed to find the picture addresses. Add the original page URL when those addresses are relative. Without it, only pictures
          that already use a full http or https URL can load.
        </p>
        <p className="mt-3">
          The caps are there so one page cannot run away. The image extractor stops a webpage list at 150 pictures. A ZIP
          holds 40. Local files and documents stop at 200. Open a thumbnail before you save it, leave the ones you do not need
          unchecked, and download the rest together. The{" "}
          <Link href="/faq" className="font-medium text-foreground underline-offset-4 hover:underline">
            FAQ
          </Link>{" "}
          explains a missing picture and the ZIP cap in more detail.
        </p>
      </section>
      <section>
        <h2 className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">Limits worth knowing</h2>
        <p className="mt-3">
          Public http and https pages only. Localhost, private networks, and pages that appear only after login are
          blocked. Pictures drawn by a script after the page loads, or hidden behind infinite scroll, are not in the
          HTML this tool reads. The image extractor skips tiny tracking pixels. A password-protected PDF cannot be opened.
        </p>
        <p className="mt-3">
          The original site or photographer owns the pictures. Download files only when you have the right to save
          them. Web pages are fetched for the preview and then discarded. PDFs, Office files, and local pictures stay
          on this computer.{" "}
          <Link href="/about" className="font-medium text-foreground underline-offset-4 hover:underline">
            About
          </Link>{" "}
          explains who the tool is for, and what it refuses to open.
        </p>
      </section>
      <section>
        <h2 className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">Read next</h2>
        <p className="mt-3">
          The{" "}
          <Link href="/how-to-use" className="font-medium text-foreground underline-offset-4 hover:underline">
            step-by-step guide
          </Link>{" "}
          shows how to use the image extractor on a page, a file, or pictures you already have. The{" "}
          <Link href="/faq" className="font-medium text-foreground underline-offset-4 hover:underline">
            FAQ
          </Link>{" "}
          covers missing pictures, the ZIP limit, and privacy.{" "}
          <Link href="/about" className="font-medium text-foreground underline-offset-4 hover:underline">
            About
          </Link>{" "}
          explains what the tool is for.
        </p>
        <UpdatedNote />
      </section>
    </div>
  );
}

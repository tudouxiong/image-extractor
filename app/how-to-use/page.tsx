import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { PageIntro } from "@/components/page-intro";
import { UpdatedNote } from "@/components/updated-note";
import { pageMetadata } from "@/lib/metadata";
import { pages } from "@/lib/site";

export const metadata = pageMetadata(pages.howTo);

const STEPS = [
  {
    title: "Choose a source",
    body: "On the home page, pick one tab: Webpage, Several pages, HTML file, PDF / Word / PPT, or Local images. The first two read public addresses. The other three read files you already have. The fields under the tabs change with the one you pick.",
  },
  {
    title: "Add the address or the files",
    body: "Paste a public URL, one address per line, or choose files. PDF, Word, PowerPoint, and local pictures stay in your browser. An HTML file can also take the original page URL when its image paths are relative. An older .doc or .ppt file needs to be saved as .docx or .pptx first.",
  },
  {
    title: "Preview before you save",
    body: "This step is the same for every source. Click any thumbnail to open it large. Use Previous and Next, or the arrow keys, to move through the set. If a thumbnail fails, the card says the preview is unavailable and you can still try a download.",
  },
  {
    title: "Download one image or a ZIP",
    body: "This step is the same for every source. Save a single picture from its card, or select several and click Download ZIP. If nothing is selected, the ZIP takes the set, up to 40 images. A note tells you when some files could not be added.",
  },
];

const SOURCES = [
  {
    title: "Webpage",
    body: "Choose Webpage, paste one public http or https address, and press Extract Images. A bare domain such as example.com is accepted. The tool reads img tags, srcset, picture sources, Open Graph and Twitter card images, and CSS backgrounds that point at an image file. A direct link to one picture returns that file. The list stops at 150 pictures. Localhost, private networks, and pages that appear only after login are refused.",
  },
  {
    title: "Several pages",
    body: "Choose Several pages and put one public address per line, up to 8 starting pages. You can also follow links that stay on the same site. The whole run still stops at 8 pages. Links to another site, or links that point at a PDF or an image file, are not followed. A page that cannot be opened is skipped, and the note says how many were skipped.",
  },
  {
    title: "HTML file",
    body: "Choose HTML file and pick a saved .html or .htm file. Its text is parsed so the picture addresses can be found, then discarded. If those addresses are relative, paste the original page URL in the base field. Leave the base empty and only pictures that already use a full http or https URL are kept.",
  },
  {
    title: "PDF, Word, or PowerPoint",
    body: "Choose PDF / Word / PPT and pick .pdf, .docx, or .pptx files. They stay in your browser and are not uploaded. A PDF is read up to 30 pages, and a longer file gets a note that later pages were left out. Word and PowerPoint pictures come from the media folder inside the file. Drawings stored as .emf or .wmf are skipped. A password-protected PDF cannot be opened.",
  },
  {
    title: "Local images",
    body: "Choose Local images, then pick image files or a folder of images. PNG, JPEG, GIF, WebP, AVIF, BMP, and SVG are listed, up to 200. Other files in the folder are ignored. Nothing in this tab is uploaded. A ZIP built from these pictures is assembled in the browser.",
  },
];

export default function HowToUsePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <PageIntro
        eyebrow="Free · No signup"
        title="How to use the image extractor"
        lede="How to use the image extractor is the same four steps for every source. Pick a public page, several pages, an HTML file, a PDF, Word, or PowerPoint file, or pictures already on your computer. Then preview the set and download the ones you want. No account."
      />
      <ol className="mt-12 space-y-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="rounded-2xl border border-line bg-card p-6">
            <p className="text-sm font-semibold text-accent">Step {index + 1}</p>
            <h2 className="mt-2 font-display text-2xl tracking-tight">{step.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
      <section className="mt-10 text-sm leading-relaxed text-muted">
        <h2 className="font-display text-2xl tracking-tight text-foreground">How to use the image extractor on each source</h2>
        <p className="mt-3">
          The preview and the ZIP do not change. The tab does. Start on the{" "}
          <Link href="/" className="font-medium text-foreground underline-offset-4 hover:underline">
            image extractor
          </Link>{" "}
          and use the source that matches the pictures you already have. A page is fetched for that visit. A PDF, a
          Word file, a PowerPoint file, and local pictures stay on this computer.
        </p>
        <div className="mt-6 space-y-6">
          {SOURCES.map((source) => (
            <section key={source.title}>
              <h3 className="font-display text-xl tracking-tight text-foreground">{source.title}</h3>
              <p className="mt-2">{source.body}</p>
            </section>
          ))}
        </div>
        <h2 className="mt-10 font-display text-2xl tracking-tight text-foreground">After the list appears</h2>
        <p className="mt-3">
          Open a thumbnail before you save it. Leave the ones you do not need unchecked. Save one picture from its
          card, or download a ZIP of up to 40. A webpage list stops at 150 pictures. Local files and documents stop at
          200. Those caps are the same on every visit.
        </p>
        <p className="mt-3">
          Pictures behind a login, or pictures that appear only after a script runs, are not in the first HTML
          response. If a picture is missing, or the ZIP stops early, the{" "}
          <Link href="/faq" className="font-medium text-foreground underline-offset-4 hover:underline">
            FAQ
          </Link>{" "}
          covers those cases.{" "}
          <Link href="/about" className="font-medium text-foreground underline-offset-4 hover:underline">
            About the tool
          </Link>{" "}
          explains what it is meant to do, and that finding a picture is not the same as owning it.
        </p>
        <p className="mt-3">
          That is how to use the image extractor: choose the source, add the page or the files, preview the set, and
          download only the pictures you have the right to save.
        </p>
      </section>
      <UpdatedNote />
      <Link
        href="/"
        className="mt-8 inline-flex h-12 min-h-11 items-center rounded-xl bg-accent px-6 text-sm font-semibold text-white"
      >
        Extract images
      </Link>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: pages.howTo.title,
          description: pages.howTo.description,
          step: STEPS.map((step, index) => ({
            "@type": "HowToStep",
            position: index + 1,
            name: step.title,
            text: step.body,
          })),
        }}
      />
    </div>
  );
}

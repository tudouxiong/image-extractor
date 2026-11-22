import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { PageIntro } from "@/components/page-intro";
import { UpdatedNote } from "@/components/updated-note";
import { pageMetadata } from "@/lib/metadata";
import { pages } from "@/lib/site";

export const metadata = pageMetadata(pages.faq);

const QUESTIONS = [
  {
    question: "Is Image Extractor free?",
    answer:
      "Yes. There is no paywall, no credit pack, and no premium tier. You can extract from a public page or a file you already have without creating an account. The same limits apply to every visit: the tool is free, and it is not a hosted library.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No signup. Open the site and extract from a page or a file. The image extractor does not ask for an email, and it keeps no profile or history. Close the tab and the preview list is gone.",
  },
  {
    question: "Where can images come from?",
    answer:
      "A public webpage, up to eight pages with optional links on the same site, an HTML file, a PDF, a Word or PowerPoint file (.docx and .pptx), or image files and folders on your computer. For an older .doc or .ppt file, save it as .docx or .pptx first. PDF, Office, and local pictures are read in your browser. A webpage list stops at 150 pictures. Local files and documents stop at 200.",
  },
  {
    question: "How fast is it?",
    answer:
      "Most public pages finish in a few seconds. A very large page, a slow host, or several pages in one run can take longer. A PDF is read in your browser, so a long file depends on that computer. The first time you open a PDF, the reader has to load. Later PDFs in the same visit reuse it.",
  },
  {
    question: "Which images are found?",
    answer:
      "On a webpage, images in img tags, including lazy-loaded and srcset versions, picture sources, Open Graph and Twitter card images, and CSS background images that point at a file. For a direct image URL, you get that one file. In a Word or PowerPoint file, pictures stored in the media folder are listed. Embedded drawings in an old vector format are skipped.",
  },
  {
    question: "Why are some images missing?",
    answer:
      "The image extractor reads the HTML the server returns. Pictures that appear only after login, infinite scroll, or a script that runs in the browser will not show up. Tiny tracking pixels are skipped. If an HTML file uses relative paths and you did not give the original page URL, those pictures are dropped. A password-protected PDF cannot be opened.",
  },
  {
    question: "Can I extract from any URL?",
    answer:
      "Public http and https pages only. Localhost, private networks, link-local addresses, and URLs with a username or password in them are blocked. Ports other than 80 and 443 are refused. The check happens before the page is fetched.",
  },
  {
    question: "How does the ZIP download work?",
    answer:
      "Save one image from its card, or build a ZIP. The image extractor caps that ZIP at 40 pictures. If you select nothing, the ZIP uses the extracted set, still with the same cap. Pictures from a public page are packed on the server for that download and are not stored. Pictures from a file on your computer are packed in the browser.",
  },
  {
    question: "Do you store the images?",
    answer:
      "No. The image extractor fetches a web page so you can preview and download, then discards it. HTML is parsed and discarded. PDFs, Office files, and local pictures are read in your browser and are not uploaded. There is no account that could hold them.",
  },
  {
    question: "What if I follow links on the same site?",
    answer:
      "On the Several pages tab you can follow links that stay on the same site. The run still stops at 8 pages, including the addresses you typed. The image extractor will not follow a link to another site, or a link that points at a PDF or an image file. A page that fails is skipped, and the result note says how many were skipped.",
  },
  {
    question: "Who owns the images?",
    answer:
      "The original site or photographer does. Use this image extractor only for images you have the right to save. The tool lists pictures it can find. It does not grant a license, and it does not check copyright for you.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <PageIntro
        eyebrow="Fast answers"
        title="Image extractor questions"
        lede="Short answers about this free image extractor: what it can open, why a picture may be missing, and how downloads work. No signup is required. Each answer matches the limits you will actually hit on the tool."
      />
      <h2 className="mt-10 font-display text-2xl tracking-tight">Common questions about this image extractor</h2>
      <div className="mt-4 border-t border-line">
        {QUESTIONS.map((item) => (
          <details key={item.question} className="group border-b border-line py-4">
            <summary className="cursor-pointer list-none">
              <h3 className="flex items-center justify-between gap-4 text-base font-medium tracking-tight">
                {item.question}
                <span className="text-muted group-open:hidden" aria-hidden>
                  +
                </span>
                <span className="hidden text-muted group-open:inline" aria-hidden>
                  –
                </span>
              </h3>
            </summary>
            <p className="pt-3 pr-8 text-sm leading-relaxed text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
      <p className="mt-8 text-sm leading-relaxed text-muted">
        Ready to try it? Open the{" "}
        <Link href="/" className="font-medium text-foreground underline-offset-4 hover:underline">
          image extractor
        </Link>
        . For the full walkthrough, read{" "}
        <Link href="/how-to-use" className="font-medium text-foreground underline-offset-4 hover:underline">
          how to use the image extractor
        </Link>
        . The{" "}
        <Link href="/about" className="font-medium text-foreground underline-offset-4 hover:underline">
          about page
        </Link>{" "}
        explains what the tool is for, and what it will not open.
      </p>
      <UpdatedNote />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: QUESTIONS.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />
    </div>
  );
}

import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { UpdatedNote } from "@/components/updated-note";
import { pageMetadata } from "@/lib/metadata";
import { pages } from "@/lib/site";

export const metadata = pageMetadata(pages.about);

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <PageIntro
        eyebrow="Free, no signup, fast"
        title="About this free image extractor"
        lede="Image Extractor is a free browser tool for pulling images from public pages and from files you already have. No account, no install, and no queue. You paste a link or choose a file, preview the pictures, and download the ones you want."
      />
      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-2xl tracking-tight text-foreground">Who this image extractor is for</h2>
          <p className="mt-3">
            It is for someone who already has a public page, a saved HTML file, a PDF, a slide deck, or a folder of
            pictures, and wants those pictures in one list. A writer collecting figures from an article they can use,
            a shop owner saving their own product photos, or a person pulling pictures out of a deck they made, can
            preview the set and keep the useful ones.
          </p>
          <p className="mt-3">
            It is a poor fit if the pictures only exist after a login, or if they are drawn by a script after the page
            loads. The image extractor is also a poor fit if you want a hosted gallery, a team workspace, or a place
            that remembers the last download. There is no account to hold that history.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl tracking-tight text-foreground">What happens when you paste a page</h2>
          <p className="mt-3">
            A public http or https address is checked before it is fetched. Localhost, private networks, and addresses
            that are not meant for the public internet are refused. The HTML that comes back is read for picture
            addresses. Those pictures are loaded so you can preview them, then the response is discarded. Nothing is
            filed under your name, because the image extractor never asks who you are.
          </p>
          <p className="mt-3">
            Several public pages can be opened in one run, including a short follow of links that stay on the same
            site. The run stops at eight pages. A page that cannot be opened is skipped. The practical steps live in
            the{" "}
            <Link href="/how-to-use" className="font-medium text-foreground underline-offset-4 hover:underline">
              guide
            </Link>
            .
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl tracking-tight text-foreground">What stays on your computer</h2>
          <p className="mt-3">
            A PDF, a Word file, a PowerPoint file, and pictures you pick from a folder are read in the browser. The
            image extractor does not upload them. A ZIP built from those local pictures is assembled on this computer as well. An HTML file
            is different: its text is sent so the picture addresses can be found, and you can add the original page
            URL when the paths are relative. That text is parsed and discarded.
          </p>
          <p className="mt-3">
            Word and PowerPoint need the newer .docx and .pptx formats. A PDF is read up to 30 pages. Local files and
            documents list up to 200 pictures. These caps keep one file from taking over the tab. The{" "}
            <Link href="/faq" className="font-medium text-foreground underline-offset-4 hover:underline">
              FAQ
            </Link>{" "}
            answers the matching questions, including why a picture can be missing.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl tracking-tight text-foreground">What it will not open</h2>
          <p className="mt-3">
            The image extractor will not sign you up, and it will not keep an image library. It will not fetch localhost, a private
            network, or a page that only exists after you log in. It will not run the scripts on the page, so a
            picture that appears only after infinite scroll stays out of the list. It will not open a password-protected
            PDF, and it will not read an older .doc or .ppt file until you save it in the newer format.
          </p>
          <p className="mt-3">
            A ZIP from a public page holds 40 pictures. If you need fewer, select them first. If the set is larger,
            the download note says the rest were left out. The image extractor uses that same ZIP cap for every visitor.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl tracking-tight text-foreground">A note on rights</h2>
          <p className="mt-3">
            Finding an image is not the same as owning it. The original site or photographer keeps the rights.
            Download files only when you have the right to use them. This image extractor lists what it can find. It
            does not grant permission, and it does not decide whether a picture is free to reuse.
          </p>
          <p className="mt-3">
            If you have a public page or a file you are allowed to save from, open the{" "}
            <Link href="/" className="font-medium text-foreground underline-offset-4 hover:underline">
              image extractor
            </Link>{" "}
            and preview the set before you download it.
          </p>
        </section>
      </div>
      <UpdatedNote />
      <Link
        href="/"
        className="mt-10 inline-flex h-12 items-center rounded-xl bg-accent px-6 text-sm font-semibold text-white"
      >
        Extract Images
      </Link>
    </div>
  );
}

import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Image Extractor. Free, no signup, fast.</p>
        <nav className="flex gap-4">
          <Link href="/how-to-use" className="hover:text-foreground">
            How to Use
          </Link>
          <Link href="/faq" className="hover:text-foreground">
            FAQ
          </Link>
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
        </nav>
      </div>
    </footer>
  );
}

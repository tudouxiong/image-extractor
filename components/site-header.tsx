"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/how-to-use", label: "How to Use" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
];

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#1d4ed8" />
      <rect x="5.5" y="10.5" width="14" height="14" rx="3" fill="#bfdbfe" transform="rotate(-16 12.5 17.5)" />
      <rect x="12.2" y="6.4" width="14" height="14" rx="3" fill="#fff" transform="rotate(12 19.2 13.4)" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const open = menuPath === pathname;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="h-0.5 bg-accent" />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 text-sm font-semibold tracking-tight sm:text-base">
          <Logo />
          <span className="truncate">Image Extractor</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-accent text-white" : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className="inline-flex h-11 shrink-0 items-center rounded-lg border border-line bg-card px-4 text-sm md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setMenuPath(open ? null : pathname)}
        >
          Menu
        </button>
      </div>
      {open ? (
        <nav id="mobile-nav" className="border-t border-line px-4 py-3 md:hidden">
          <div className="flex flex-col">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`min-h-11 rounded-xl px-3 py-3 text-sm ${active ? "bg-accent text-white" : "text-foreground"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

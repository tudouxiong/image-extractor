export function PageIntro({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede: string;
}) {
  return (
    <header className="max-w-3xl">
      <p className="text-sm font-semibold tracking-wide text-accent">{eyebrow}</p>
      <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">{lede}</p>
    </header>
  );
}

export function FeatureGrid() {
  const features = [
    {
      title: "Free, with no account",
      body: "Open the page and extract. There is no signup, no trial, and no paywall.",
    },
    {
      title: "Pages, files, and folders",
      body: "Use a public page, several pages, an HTML file, a PDF, Word, or PowerPoint file, or pictures on your computer.",
    },
    {
      title: "Preview, then download",
      body: "Open any image large, keep the ones you want, and save them together in a ZIP.",
    },
  ];

  return (
    <section className="mt-16 grid gap-4 sm:mt-20 sm:grid-cols-3">
      {features.map((feature) => (
        <article key={feature.title} className="rounded-2xl border border-line bg-card p-6">
          <h2 className="font-display text-xl tracking-tight sm:text-2xl">{feature.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{feature.body}</p>
        </article>
      ))}
    </section>
  );
}

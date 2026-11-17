import React from 'react';

/** The small swell line + number that opens every section. */
export function SectionIndex({ index }: { index: string }) {
  return (
    <p className="eyebrow inline-flex items-center gap-2 tabular-nums !text-ocean">
      <svg viewBox="0 0 28 8" className="h-2 w-7 text-sun" aria-hidden>
        <path d="M1 4c3 0 3-3 6.5-3S11 7 14 7s3.5-6 6.5-6S24 4 27 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {index}
    </p>
  );
}

export function PageSection({
  id,
  index,
  title,
  intro,
  children,
}: {
  id: string;
  index: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="reveal mt-20 sm:mt-36" aria-labelledby={`${id}-title`}>
      <div className="mb-8 grid gap-3 sm:mb-10 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-end">
        <div>
          <SectionIndex index={index} />
          <h2 id={`${id}-title`} className="display mt-2 text-[2.75rem] leading-none sm:text-6xl">
            {title}
          </h2>
        </div>
        <p className="max-w-md text-ink-2 sm:justify-self-end">{intro}</p>
      </div>
      {children}
    </section>
  );
}

export function HeroSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando condiciones">
      <div className="h-5 w-64 rounded bg-line/70 animate-pulse-soft" />
      <div className="mt-4 h-20 w-full max-w-xl rounded bg-line/70 animate-pulse-soft" />
      <div className="mt-6 h-5 w-full max-w-2xl rounded bg-line/50 animate-pulse-soft" />
      <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-14 rounded bg-line/50 animate-pulse-soft" />
        ))}
      </div>
    </div>
  );
}


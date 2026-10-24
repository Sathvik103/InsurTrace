import React from 'react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PageHero } from '@/components/public/PageHero';

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

/** Shared layout for privacy, terms and disclaimer: plain sections with a contents list. */
export function LegalPage({ eyebrow, title, accent, intro, updated, sections }: { eyebrow: string; title: string; accent?: string; intro: string; updated: string; sections: LegalSection[] }) {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar tone="dark" />
      <main>
        <PageHero compact eyebrow={eyebrow} title={title} accent={accent} body={intro} />
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[220px_1fr]">
          <nav aria-label="Contents" className="hidden lg:block">
            <div className="sticky top-28 space-y-1">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-navy-400">Contents</p>
              {sections.map((s, i) => (
                <a key={s.id} href={`#${s.id}`} className="block rounded-lg px-2 py-1.5 text-sm text-navy-500 transition hover:bg-[#f6f5f0] hover:text-navy-950">
                  <span className="mr-2 font-mono text-xs text-navy-300">{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                </a>
              ))}
            </div>
          </nav>
          <article className="max-w-2xl">
            <p className="font-mono text-xs text-navy-400">Last updated {updated}</p>
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28 border-b border-navy-100 py-8 last:border-0">
                <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-950">
                  <span className="mr-3 font-mono text-sm text-navy-300">{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                </h2>
                <div className="mt-4 space-y-3 leading-relaxed text-navy-600 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-1.5">{s.body}</div>
              </section>
            ))}
          </article>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

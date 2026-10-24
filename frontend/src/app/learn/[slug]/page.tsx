import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Calculator, ScanSearch } from 'lucide-react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { KNOWLEDGE, LAST_REVIEWED } from '@/content/assistantKnowledge';
import { BRAND } from '@/lib/brand';

export const dynamicParams = false;

export function generateStaticParams() {
  return KNOWLEDGE.map((k) => ({ slug: k.id }));
}

const find = (slug: string) => KNOWLEDGE.find((k) => k.id === slug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const entry = find((await params).slug);
  if (!entry) return {};
  return {
    title: entry.question,
    description: entry.answer[0].slice(0, 160),
    alternates: { canonical: `/learn/${entry.id}` },
    openGraph: { title: entry.question, description: entry.answer[0].slice(0, 200), type: 'article' },
  };
}

export default async function LearnArticle({ params }: { params: Promise<{ slug: string }> }) {
  const entry = find((await params).slug);
  if (!entry) notFound();
  const related = (entry.followUps || [])
    .map((q) => KNOWLEDGE.find((k) => k.question === q))
    .filter((k): k is (typeof KNOWLEDGE)[number] => !!k);
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [{ '@type': 'Question', name: entry.question, acceptedAnswer: { '@type': 'Answer', text: entry.answer.join(' ') } }],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Guide', item: `${BRAND.siteUrl}/learn` },
        { '@type': 'ListItem', position: 2, name: entry.question, item: `${BRAND.siteUrl}/learn/${entry.id}` },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-10">
        <Link href="/learn" className="inline-flex items-center gap-1.5 text-sm font-medium text-steel-700 hover:underline"><ArrowLeft className="h-4 w-4" /> Car insurance guide</Link>
        <article className="mt-6">
          <h1 className="text-3xl font-semibold tracking-tight text-navy-950 sm:text-4xl">{entry.question}</h1>
          <p className="mt-2 text-sm text-navy-400">Reviewed {LAST_REVIEWED} · General guidance; your policy wording and insurer decide your claim.</p>
          <div className="mt-8 space-y-5 text-lg leading-relaxed text-navy-700">
            {entry.answer.map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
          </div>
        </article>

        <section className="mt-12 grid gap-3 sm:grid-cols-2">
          <Link href="/" className="vs-surface flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
            <Calculator className="h-6 w-6 shrink-0 text-steel-600" />
            <span><span className="block font-semibold text-navy-900">Should you claim?</span><span className="text-sm text-navy-500">Try the free quick check</span></span>
          </Link>
          <Link href="/xray" className="vs-surface flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
            <ScanSearch className="h-6 w-6 shrink-0 text-steel-600" />
            <span><span className="block font-semibold text-navy-900">X-ray your repair quote</span><span className="text-sm text-navy-500">See who pays for each line</span></span>
          </Link>
        </section>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold text-navy-900">Related questions</h2>
            <ul className="mt-3 divide-y divide-navy-100 rounded-2xl border border-navy-100 bg-white">
              {related.map((k) => (
                <li key={k.id}>
                  <Link href={`/learn/${k.id}`} className="flex items-center justify-between gap-4 px-5 py-4 text-navy-800 hover:bg-navy-50/60">
                    {k.question} <ArrowRight className="h-4 w-4 text-navy-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}

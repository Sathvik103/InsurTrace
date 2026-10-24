import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { KNOWLEDGE, LAST_REVIEWED } from '@/content/assistantKnowledge';

export const metadata: Metadata = {
  title: 'Car insurance guide for India: NCB, IDV, deductibles and claims',
  description:
    'Plain-language answers on Indian car insurance: how No-Claim Bonus works, what IDV means, deductibles, depreciation on parts, zero-dep cover, documents for a claim and when claiming is worth it.',
  alternates: { canonical: '/learn' },
};

const TOPICS: { key: (typeof KNOWLEDGE)[number]['topic']; title: string }[] = [
  { key: 'money', title: 'Money: NCB, deductibles and depreciation' },
  { key: 'basics', title: 'Policy basics' },
  { key: 'claims', title: 'Making a claim' },
  { key: 'privacy', title: 'Your data' },
];

export default function LearnHub() {
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: KNOWLEDGE.filter((k) => k.topic !== 'verisure').map((k) => ({
      '@type': 'Question',
      name: k.question,
      acceptedAnswer: { '@type': 'Answer', text: k.answer.join(' ') },
    })),
  };
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-10">
        <header className="max-w-2xl space-y-3">
          <p className="text-sm font-semibold text-steel-700">Car insurance guide</p>
          <h1 className="text-3xl font-semibold tracking-tight text-navy-950 sm:text-5xl">Indian car insurance, explained simply.</h1>
          <p className="text-lg text-navy-600">Short answers to the questions people actually ask before making a claim. Reviewed {LAST_REVIEWED}.</p>
        </header>
        <div className="mt-12 space-y-12">
          {TOPICS.map((t) => {
            const entries = KNOWLEDGE.filter((k) => k.topic === t.key);
            if (!entries.length) return null;
            return (
              <section key={t.key}>
                <h2 className="text-xl font-semibold text-navy-900">{t.title}</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {entries.map((k) => (
                    <li key={k.id}>
                      <Link href={`/learn/${k.id}`} className="vs-surface group flex h-full items-start justify-between gap-4 p-5 transition hover:-translate-y-0.5">
                        <span>
                          <span className="block font-semibold text-navy-900">{k.question}</span>
                          <span className="mt-1 line-clamp-2 block text-sm text-navy-500">{k.answer[0]}</span>
                        </span>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-navy-300 transition group-hover:translate-x-0.5 group-hover:text-navy-700" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

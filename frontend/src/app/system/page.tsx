'use client';

import React from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PageHero } from '@/components/public/PageHero';
import { Numbers } from '@/components/system/Numbers';
import { Architecture } from '@/components/system/Architecture';
import { WorkingDiagrams } from '@/components/system/WorkingDiagrams';
import { Stack } from '@/components/system/Stack';
import { DataModel } from '@/components/system/DataModel';
import { Tradeoffs } from '@/components/system/Tradeoffs';
import { Scalability } from '@/components/system/Scalability';

/** /system: how ClearClaim is built. Data in content/system.ts, sections in components/system. */
export default function SystemPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar tone="dark" />
      <main>
        <PageHero
          compact
          eyebrow="System"
          title="How ClearClaim"
          accent="works inside."
          body="The parts, how a request moves between them, the tools we used, the trade-offs we made and how it would grow. Everything here describes the system as it runs today."
          actions={
            <div className="flex flex-wrap gap-2 text-sm">
              {[
                ['#architecture', 'Architecture'],
                ['#working', 'Working diagrams'],
                ['#stack', 'Stack'],
                ['#data', 'Data model'],
                ['#tradeoffs', 'Trade-offs'],
                ['#scale', 'Scalability'],
              ].map(([href, label]) => (
                <a key={href} href={href} className="rounded-lg border border-white/20 px-3 py-1.5 font-medium text-white/80 transition hover:bg-white/10 hover:text-white">{label}</a>
              ))}
            </div>
          }
        />
        <Numbers />
        <Architecture />
        <WorkingDiagrams />
        <Stack />
        <DataModel />
        <Tradeoffs />
        <Scalability />
        <section className="bg-white px-5 py-16">
          <p className="mx-auto max-w-6xl text-sm text-ink-500">
            The code is open: <a href="https://github.com/Sathvik103/InsurTrace" target="_blank" rel="noreferrer" className="font-semibold text-ink-950 underline-offset-2 hover:underline">github.com/Sathvik103/InsurTrace</a>. For what we protect and how, see{' '}
            <Link href="/security" className="font-semibold text-ink-950 underline-offset-2 hover:underline">Security</Link>.
          </p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

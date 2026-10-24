import Link from 'next/link';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PageHero } from '@/components/public/PageHero';
import { Reveal } from '@/components/home/fx';
import { BRAND } from '@/lib/brand';

// Only what the system actually does today. Update this page when that changes.
const CONTROLS = [
  {
    title: 'Every request is checked on our server',
    body: 'Your sign-in token is verified by our server on each request. Your role (car owner, fleet, workshop and so on) comes from our database, never from your browser, so it can’t be changed by editing the page.',
  },
  {
    title: 'You see only your own records',
    body: 'You can open vehicles you registered and those an owner has shared with your organisation. Anything else returns “not found”, so other people’s records can’t even be confirmed to exist.',
  },
  {
    title: 'Sharing needs your permission',
    body: 'A workshop or insurer sees a vehicle’s records only after you grant access, for a period you choose. You can revoke it at any time, and grants and revocations are logged.',
  },
  {
    title: 'Uploads are handled carefully',
    body: 'Only PDFs up to 10 MB are accepted, and the file is checked to really be a PDF. It is read to extract the figures and is not stored.',
  },
  {
    title: 'Limits against abuse',
    body: 'Requests are rate-limited, and the site sends standard browser security headers. Sign-up can only create car owner, fleet or workshop accounts.',
  },
  {
    title: 'Tamper-evident records',
    body: 'Saved checks get a SHA-256 fingerprint. When a ledger is connected, the fingerprint is anchored on Hyperledger Fabric; re-checking later shows whether the record was edited. It proves the record is unchanged, not that the events in it happened.',
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar tone="dark" />
      <main>
        <PageHero
          compact
          eyebrow="Security"
          title="How we look after"
          accent="your records."
          body="Plain answers to what we protect and how. If something here stops being true, we change the page."
        />

        <section className="bg-[#f6f5f0] px-5 py-24">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CONTROLS.map((c, i) => (
              <Reveal key={c.title} delay={(i % 3) * 0.06}>
                <div className="h-full rounded-[28px] bg-white p-7 ring-1 ring-navy-100">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-950 font-mono text-xs font-semibold text-signal">0{i + 1}</span>
                  <h2 className="mt-5 font-display text-xl font-semibold tracking-tight text-navy-950">{c.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-navy-500">{c.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="bg-white px-5 py-24">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal>
              <h2 className="font-display text-4xl font-semibold leading-[1] tracking-[-0.04em] text-navy-950">What we don’t do.</h2>
            </Reveal>
            <ul className="border-t border-navy-100 text-lg text-navy-700">
              {[
                'Sell or share your data with insurers, brokers or advertisers',
                'Send anything to an insurer on your behalf',
                'Produce fraud or risk scores about you',
                'Keep the PDFs you upload',
              ].map((t) => (
                <li key={t} className="border-b border-navy-100 py-5">{t}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-5 pb-24">
          <p className="mx-auto max-w-6xl text-sm text-navy-500">
            Found a security problem? Email <a href={`mailto:${BRAND.contactEmail}?subject=Security`} className="font-semibold text-navy-950 underline-offset-2 hover:underline">{BRAND.contactEmail}</a>. See also the{' '}
            <Link href="/privacy" className="font-semibold text-navy-950 underline-offset-2 hover:underline">privacy notice</Link>.
          </p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

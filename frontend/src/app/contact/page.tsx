'use client';

import React, { useState } from 'react';
import { Check, Copy, Mail } from 'lucide-react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PageHero } from '@/components/public/PageHero';
import { BRAND } from '@/lib/brand';

const TOPICS = ['A question about my result', 'Fleet or workshop use', 'Something looks wrong', 'Privacy or deletion request', 'Security issue'];

export default function ContactPage() {
  const [copied, setCopied] = useState(false);
  const [topic, setTopic] = useState(TOPICS[0]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const copy = () => {
    // Only claim "copied" when the browser actually allowed it.
    navigator.clipboard
      ?.writeText(BRAND.contactEmail)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => {});
  };

  // No form backend: this prepares an email in the visitor's own mail app.
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `[ClearClaim] ${topic}${name ? ` from ${name}` : ''}`;
    window.location.href = `mailto:${BRAND.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar tone="dark" />
      <main>
        <PageHero compact eyebrow="Contact" title="Talk to a person," accent="not a ticket queue." body="Questions about a result, using ClearClaim for a fleet or workshop, or something that looks wrong. Every message is read." />

        <section className="mx-auto grid max-w-6xl gap-8 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <div className="rounded-2xl bg-navy-950 p-7 text-white">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">Email</p>
              <p className="mt-2 break-all font-display text-xl font-semibold">{BRAND.contactEmail}</p>
              <div className="mt-5 flex gap-2">
                <a href={`mailto:${BRAND.contactEmail}`} className="vs-btn-signal py-2.5 text-sm"><Mail className="h-4 w-4" /> Write</a>
                <button type="button" onClick={copy} className="vs-btn-ghost-dark py-2.5 text-sm">
                  {copied ? <Check className="h-4 w-4 text-signal" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-navy-100 p-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-navy-400">Source code</p>
              <a href="https://github.com/Sathvik103/InsurTrace" target="_blank" rel="noreferrer" className="mt-2 block font-display text-lg font-semibold text-navy-950 underline-offset-2 hover:underline">
                github.com/Sathvik103/InsurTrace
              </a>
              <p className="mt-1 text-sm text-navy-500">Read the code or open an issue.</p>
            </div>
          </div>

          <form onSubmit={send} className="space-y-6 rounded-2xl border border-navy-100 bg-[#f6f5f0] p-7 sm:p-9">
            <fieldset>
              <legend className="text-sm font-medium text-navy-800">What is it about?</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <button key={t} type="button" onClick={() => setTopic(t)} aria-pressed={topic === t} className={`rounded-md px-3.5 py-2 text-sm font-medium transition ${topic === t ? 'bg-navy-950 text-white' : 'bg-white text-navy-700 ring-1 ring-navy-100 hover:ring-navy-300'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="text-sm font-medium text-navy-800">Your name (optional)</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="vs-input mt-1.5" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-navy-800">Message</span>
              <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="vs-input mt-1.5 resize-y" />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-navy-500">This opens your email app with the message ready to send.</p>
              <button type="submit" className="vs-btn-primary shrink-0"><Mail className="h-4 w-4" /> Open in email</button>
            </div>
          </form>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

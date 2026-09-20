'use client';

import React, { useState } from 'react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { FadeIn, SlideUp } from '@/components/motion/MotionPrimitives';
import { Mail, CheckCircle, Copy, Send } from 'lucide-react';

export default function ContactPage() {
  const [copied, setCopied] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const contactEmail = 'sathvikkandukuri202@gmail.com';

  const handleCopy = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(
      `[VeriSure] ${formState.subject}: ${formState.name}`
    )}&body=${encodeURIComponent(
      `Name: ${formState.name}\nEmail: ${formState.email}\n\nMessage:\n${formState.message}`
    )}`;
    window.location.href = mailto;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      <PublicNavbar />

      <main className="flex-1 pt-24 pb-16">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-6">
              <Mail className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              <span>Direct Engineering Communication</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 max-w-2xl leading-tight">
              Get in touch with the VeriSure team.
            </h1>
            <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
              Have questions about enterprise deployment, Hyperledger Fabric integration, or motor insurance financial modeling? We welcome technical collaboration.
            </p>
          </FadeIn>

          <SlideUp delay={0.1} className="mt-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Direct email card */}
              <div className="md:col-span-5 space-y-6">
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Direct Contact
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    You can reach out directly for architecture discussions, pilot deployments, or security inquiries.
                  </p>
                  <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="text-xs font-mono text-zinc-800 dark:text-zinc-200 truncate pr-2">
                      {contactEmail}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded transition-colors shrink-0"
                      title="Copy email"
                    >
                      {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Open Source Repository
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Inspect the source code, open issues, and verify chaincode deployments on GitHub:
                  </p>
                  <a
                    href="https://github.com/Sathvik103/InsurTrace"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-zinc-900 dark:text-zinc-100 font-semibold hover:underline block pt-1"
                  >
                    github.com/Sathvik103/InsurTrace
                  </a>
                </div>
              </div>

              {/* Inquiry form */}
              <div className="md:col-span-7">
                <form
                  onSubmit={handleSubmit}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 sm:p-8 space-y-4 shadow-xs"
                >
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="e.g., Rajesh Mehta"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Your Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      placeholder="e.g., rajesh@example.com"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Subject
                    </label>
                    <select
                      value={formState.subject}
                      onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Enterprise Integration">Enterprise Integration</option>
                      <option value="Security Disclosure">Security Disclosure</option>
                      <option value="Bug Report">Bug Report</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Message
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formState.message}
                      onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                      placeholder="Describe your inquiry or technical feedback..."
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message to sathvikkandukuri202@gmail.com</span>
                  </button>
                  {submitted && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 text-center mt-2">
                      Opening default mail client to dispatch your message.
                    </p>
                  )}
                </form>
              </div>
            </div>
          </SlideUp>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUp, BookOpen, Calculator, MessageCircleQuestion, Activity, Sparkles, X, RotateCcw } from 'lucide-react';
import { useAssistant } from '@/context/AssistantContext';
import { answer, AssistantAnswer, needsStatus, StatusSnapshot } from '@/lib/assistantEngine';
import { LAST_REVIEWED, STARTER_QUESTIONS } from '@/content/assistantKnowledge';
import { apiFetch } from '@/lib/api';
import type { SystemStatus } from '@/lib/useSystemStatus';
import { VeriSureMark } from '@/components/brand/VeriSureLogo';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text?: string;
  answer?: AssistantAnswer;
}

const STORAGE_KEY = 'verisure_assistant_thread';

const SOURCE_LABEL: Record<AssistantAnswer['source'], { label: string; Icon: typeof BookOpen }> = {
  guide: { label: `VeriSure insurance guide · reviewed ${LAST_REVIEWED}`, Icon: BookOpen },
  'your-result': { label: 'Calculated from your result on this page', Icon: Calculator },
  'system-status': { label: 'Live system status', Icon: Activity },
  none: { label: 'No matching guide entry', Icon: MessageCircleQuestion },
};

async function loadStatus(): Promise<StatusSnapshot> {
  try {
    const s = await apiFetch<SystemStatus>('/api/v1/system/status', { anonymous: true, timeoutMs: 20000 });
    return {
      reachable: true,
      ledgerStatus: s.components?.hyperledger_fabric?.status,
      ledgerMode: s.components?.hyperledger_fabric?.mode,
      dataMode: s.data_mode,
    };
  } catch {
    return { reachable: false };
  }
}

export function AssistantWidget() {
  const { isOpen, open, close, context, consumePendingQuestion, pendingQuestion } = useAssistant();
  const reduce = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>(() => {
    // Restore this tab's conversation (the panel is closed on first render, so no hydration mismatch).
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]') as Message[];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const idRef = useRef(messages.reduce((m, x) => Math.max(m, x.id), 0) + 1);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {}
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
  }, [messages, thinking, reduce]);

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || thinking) return;
      setInput('');
      setMessages((m) => [...m, { id: idRef.current++, role: 'user', text: q }]);
      setThinking(true);
      const status = needsStatus(q) ? await loadStatus() : undefined;
      // A short pause so the reply reads as a response rather than a flash.
      await new Promise((r) => setTimeout(r, reduce ? 0 : 380));
      const reply = answer(q, context, status);
      setMessages((m) => [...m, { id: idRef.current++, role: 'assistant', answer: reply }]);
      setThinking(false);
    },
    [context, thinking, reduce]
  );

  // Questions sent from elsewhere in the app ("Ask about this").
  useEffect(() => {
    if (isOpen && pendingQuestion) {
      const q = consumePendingQuestion();
      if (q) setTimeout(() => ask(q), 0);
    }
  }, [isOpen, pendingQuestion, consumePendingQuestion, ask]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, close]);

  const hasResult = context.kind === 'claim-result';
  const starters = hasResult ? ['Explain my result', ...STARTER_QUESTIONS.slice(1)] : STARTER_QUESTIONS;

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="launcher"
            type="button"
            onClick={() => open()}
            initial={{ opacity: 0, scale: 0.8, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 12 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="fixed bottom-20 right-4 z-[60] lg:bottom-6 lg:right-6 flex items-center gap-2.5 rounded-full bg-navy-900 p-3 text-sm sm:py-3 sm:pl-3.5 sm:pr-5 font-semibold text-white shadow-[0_12px_32px_-8px_rgba(17,26,49,0.6)]"
            aria-label="Open the VeriSure Assistant"
          >
            <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
              <Sparkles className="h-4 w-4 text-steel-300" aria-hidden="true" />
              {hasResult && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-steel-400 ring-2 ring-navy-900" />}
            </span>
            <span className="hidden sm:inline">{hasResult ? 'Explain my result' : 'Ask VeriSure'}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="scrim"
              className="fixed inset-0 z-[60] bg-navy-950/20 backdrop-blur-[2px] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.section
              key="panel"
              role="dialog"
              aria-label="VeriSure Assistant"
              aria-modal="false"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              style={{ transformOrigin: 'bottom right' }}
              className="fixed inset-x-0 bottom-0 z-[61] flex h-[88dvh] flex-col overflow-hidden rounded-t-[28px] border border-navy-100 bg-white shadow-[0_24px_64px_-16px_rgba(17,26,49,0.35)] md:inset-x-auto md:bottom-6 md:right-6 md:h-[min(640px,calc(100dvh-48px))] md:w-[400px] md:rounded-[28px]"
            >
              {/* Header */}
              <header className="relative flex items-center gap-3 border-b border-navy-100 bg-gradient-to-b from-navy-50 to-white px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-navy-100">
                  <VeriSureMark size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] font-semibold text-navy-900">VeriSure Assistant</h2>
                  <p className="truncate text-xs text-navy-500">Plain-language help · not your insurer</p>
                </div>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMessages([])}
                    className="rounded-full p-2 text-navy-400 transition hover:bg-navy-100 hover:text-navy-700"
                    aria-label="Start a new conversation"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={close}
                  className="rounded-full p-2 text-navy-400 transition hover:bg-navy-100 hover:text-navy-700"
                  aria-label="Close assistant"
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              {/* Messages */}
              <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
                {messages.length === 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-5">
                    <div className="space-y-2">
                      <p className="text-2xl font-semibold tracking-tight text-navy-900">Hi, how can I help?</p>
                      <p className="text-sm leading-relaxed text-navy-600">
                        {hasResult
                          ? 'I can walk you through the result on your screen, line by line, or explain any insurance term.'
                          : 'Ask about claims, No-Claim Bonus, IDV, deductibles, or how VeriSure works. I answer from VeriSure’s insurance guide and never guess.'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {starters.map((q, i) => (
                        <motion.button
                          key={q}
                          type="button"
                          onClick={() => ask(q)}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + i * 0.05 }}
                          className={`group flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                            i === 0 && hasResult
                              ? 'border-steel-200 bg-steel-50 text-steel-800 hover:border-steel-300'
                              : 'border-navy-100 bg-white text-navy-800 hover:border-navy-200 hover:bg-navy-50'
                          }`}
                        >
                          {q}
                          <ArrowUp className="h-4 w-4 rotate-45 text-navy-300 transition group-hover:text-navy-600" />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {messages.map((m) =>
                  m.role === 'user' ? (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                      <p className="max-w-[85%] rounded-3xl rounded-br-lg bg-navy-900 px-4 py-2.5 text-sm text-white">{m.text}</p>
                    </motion.div>
                  ) : (
                    <AssistantBubble key={m.id} reply={m.answer!} onAsk={ask} onNavigate={close} />
                  )
                )}

                {thinking && (
                  <div className="flex items-center gap-1.5 px-1" aria-label="Assistant is answering">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-2 w-2 rounded-full bg-navy-300"
                        animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Composer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  ask(input);
                }}
                className="border-t border-navy-100 bg-white p-3"
              >
                <div className="flex items-end gap-2 rounded-3xl border border-navy-200 bg-navy-50/40 p-1.5 pl-4 transition focus-within:border-steel-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-steel-500/10">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        ask(input);
                      }
                    }}
                    rows={1}
                    maxLength={300}
                    placeholder="Ask a question…"
                    aria-label="Your question"
                    className="max-h-28 min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || thinking}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-900 text-white transition hover:bg-navy-800 disabled:bg-navy-200"
                    aria-label="Send"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
                <p className="px-2 pt-2 text-center text-[11px] text-navy-400">
                  General guidance only. Your policy wording and insurer decide your claim.
                </p>
              </form>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function AssistantBubble({ reply, onAsk, onNavigate }: { reply: AssistantAnswer; onAsk: (q: string) => void; onNavigate: () => void }) {
  const { label, Icon } = SOURCE_LABEL[reply.source];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="space-y-2.5">
      <div className="max-w-[92%] space-y-2.5 rounded-3xl rounded-bl-lg border border-navy-100 bg-white px-4 py-3.5 text-sm leading-relaxed text-navy-800 shadow-[0_1px_2px_rgba(17,26,49,0.04)]">
        {reply.paragraphs.map((p, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08 * i }}
            className="whitespace-pre-line"
          >
            {p}
          </motion.p>
        ))}
        {reply.links && reply.links.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {reply.links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={onNavigate}
                className="inline-flex items-center gap-1 rounded-full bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-800"
              >
                {l.label} →
              </Link>
            ))}
          </div>
        )}
        <p className="flex items-center gap-1.5 border-t border-navy-50 pt-2 text-[11px] text-navy-400">
          <Icon className="h-3 w-3" aria-hidden="true" />
          {label}
        </p>
      </div>
      {reply.followUps && reply.followUps.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {reply.followUps.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onAsk(q)}
              className="rounded-full border border-navy-100 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 transition hover:border-steel-300 hover:bg-steel-50 hover:text-steel-800"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AssistantContextData } from '@/lib/assistantEngine';

interface AssistantApi {
  context: AssistantContextData;
  setContext: (ctx: AssistantContextData) => void;
  isOpen: boolean;
  open: (question?: string) => void;
  close: () => void;
  pendingQuestion: string | null;
  consumePendingQuestion: () => string | null;
}

const Ctx = createContext<AssistantApi | null>(null);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<AssistantContextData>({ kind: 'none' });
  const [isOpen, setOpen] = useState(false);
  const [pendingQuestion, setPending] = useState<string | null>(null);

  const open = useCallback((question?: string) => {
    if (question) setPending(question);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  const consumePendingQuestion = useCallback(() => {
    const q = pendingQuestion;
    setPending(null);
    return q;
  }, [pendingQuestion]);

  const value = useMemo(
    () => ({ context, setContext, isOpen, open, close, pendingQuestion, consumePendingQuestion }),
    [context, isOpen, open, close, pendingQuestion, consumePendingQuestion]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAssistant() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAssistant must be used inside AssistantProvider');
  return ctx;
}

/** Lets a page share what the user is looking at, and clears it when the page unmounts. */
export function useAssistantPageContext(data: AssistantContextData | null) {
  const { setContext } = useAssistant();
  useEffect(() => {
    if (data) setContext(data);
    return () => setContext({ kind: 'none' });
  }, [data, setContext]);
}

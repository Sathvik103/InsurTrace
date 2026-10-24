/**
 * ClearClaim Assistant answer engine.
 *
 * Deterministic and local: answers come from the curated knowledge base, from
 * the result the user is currently viewing (already loaded in the browser, so
 * no extra data access), or from the live system status. Nothing is sent to a
 * third-party model, and nothing is made up: when no answer fits, it says so.
 */

import { KNOWLEDGE, KnowledgeEntry, KnowledgeLink } from '@/content/assistantKnowledge';
import { EngineResult, PolicyInputs, rupees, threeYearPremiumImpact, verdictFor } from '@/lib/claimCheck';

export type AssistantContextData =
  | { kind: 'claim-result'; result: EngineResult; policy: PolicyInputs; vehicleName?: string }
  | { kind: 'none' };

export interface AssistantAnswer {
  paragraphs: string[];
  links?: KnowledgeLink[];
  followUps?: string[];
  source: 'guide' | 'your-result' | 'system-status' | 'none';
  entryId?: string;
}

const STOPWORDS = new Set(
  'a an the is are was were be to of in on for and or my me i you your it this that what how why do does can will should with at by from about if when which who much many get'.split(' ')
);

export function normalise(text: string): string {
  return text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9₹%\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokens(text: string): string[] {
  return normalise(text).split(' ').filter((t) => t && !STOPWORDS.has(t));
}

export function scoreEntry(query: string, entry: KnowledgeEntry): number {
  const q = ` ${normalise(query)} `;
  let score = 0;
  for (const kw of entry.keywords) {
    const k = normalise(kw);
    if (q.includes(` ${k} `) || (k.length > 4 && q.includes(k))) score += 3 + k.split(' ').length;
  }
  const qTokens = new Set(tokens(query));
  for (const t of tokens(entry.question)) if (qTokens.has(t)) score += 1;
  if (normalise(entry.question) === normalise(query)) score += 20;
  return score;
}

export function searchKnowledge(query: string, limit = 3): { entry: KnowledgeEntry; score: number }[] {
  return KNOWLEDGE.map((entry) => ({ entry, score: scoreEntry(query, entry) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

const RESULT_INTENT = /(my result|this result|explain (this|my|the result|it)|why (claim|self|pay|is it|this)|should i claim|my payout|how much (will|would|can) (i|the insurer)|what do i pay|my numbers|recommend)/;
const STATUS_INTENT = /(ledger|fabric|blockchain).*(offline|down|not connected|unavailable|pending|working|status)|status of|is (the )?(system|server|ledger) (up|down|working)|system status/;

export function needsStatus(query: string): boolean {
  return STATUS_INTENT.test(normalise(query));
}

function explainResult(ctx: Extract<AssistantContextData, { kind: 'claim-result' }>): AssistantAnswer {
  const { result: r, policy: p } = ctx;
  const v = verdictFor(r);
  const threeYear = threeYearPremiumImpact(r);
  const paragraphs = [
    `${v.headline}. ${v.summary}`,
    `Here is how your numbers work out${ctx.vehicleName ? ` for your ${ctx.vehicleName}` : ''}: the repair bill is ${rupees(r.total_estimate)}. Depreciation takes off ${rupees(r.depreciation_deduction)}${p.zeroDep ? ' (you have zero-dep cover)' : ''} and your deductible takes off ${rupees(r.deductible_deduction)}, so your insurer could pay about ${rupees(r.estimated_payout)}.`,
    `If you claim, you pay ${rupees(r.immediate_out_of_pocket)} now, and your No-Claim Bonus drops from ${p.ncbPercentage}% to 0%. That costs about ${rupees(r.future_ncb_impact)} more at next year’s renewal${threeYear > r.future_ncb_impact ? `, and about ${rupees(threeYear)} in total over three years` : ''}. If you pay yourself, it costs ${rupees(r.self_pay_cost)}.`,
    'These are estimates from standard rules. Your insurer and surveyor decide the actual settlement.',
  ];
  return {
    paragraphs,
    source: 'your-result',
    followUps: ['How does depreciation reduce my claim?', 'How does No-Claim Bonus (NCB) work?', 'Is this the amount my insurer will pay?'],
  };
}

export interface StatusSnapshot {
  ledgerStatus?: string;
  ledgerMode?: string;
  dataMode?: string;
  reachable: boolean;
}

function explainStatus(s: StatusSnapshot): AssistantAnswer {
  if (!s.reachable) {
    return {
      paragraphs: [
        'I can’t reach the ClearClaim server right now, so I can’t check the live status. If the server has been idle it can take up to a minute to wake up. Try again shortly.',
      ],
      source: 'system-status',
      links: [{ label: 'System status', href: '/settings?tab=status' }],
    };
  }
  const ledger =
    s.ledgerStatus === 'CONNECTED'
      ? 'The integrity ledger is connected, so saved records are anchored straight away.'
      : s.ledgerStatus === 'DEGRADED'
        ? 'The integrity ledger is partly available. Some anchoring may be delayed.'
        : 'The integrity ledger is not connected to this deployment right now. Records are still saved, and their fingerprints wait as “pending” until you retry.';
  const data =
    s.dataMode === 'DEMO_SANDBOX'
      ? 'This deployment runs on the demo sandbox: records are fictional and reset when the server restarts.'
      : 'Your records are stored in the ClearClaim database.';
  return {
    paragraphs: [ledger, data, 'Your financial estimates do not depend on the ledger.'],
    source: 'system-status',
    links: [{ label: 'Full system status', href: '/settings?tab=status' }],
  };
}

export function answer(query: string, ctx: AssistantContextData, status?: StatusSnapshot): AssistantAnswer {
  const q = normalise(query);
  if (!q) return { paragraphs: ['Ask me anything about your car insurance or ClearClaim.'], source: 'none' };

  if (ctx.kind === 'claim-result' && RESULT_INTENT.test(q)) return explainResult(ctx);
  if (status && STATUS_INTENT.test(q)) return explainStatus(status);

  const [best, ...rest] = searchKnowledge(query, 4);
  if (best && best.score >= 3) {
    const entry = best.entry;
    return {
      paragraphs: entry.answer,
      links: entry.links,
      followUps: entry.followUps ?? rest.slice(0, 2).map((r) => r.entry.question),
      source: 'guide',
      entryId: entry.id,
    };
  }

  if (RESULT_INTENT.test(q)) {
    return {
      paragraphs: ['Run a claim check first, then I can explain your own numbers line by line.'],
      links: [{ label: 'Check a claim', href: '/decision' }],
      source: 'none',
    };
  }

  return {
    paragraphs: [
      'I don’t have a reliable answer to that, and I’d rather not guess. I can help with motor-insurance basics (IDV, NCB, deductibles, depreciation), claims, and how ClearClaim works. For anything specific to your policy wording, please check with your insurer.',
    ],
    followUps: (best ? [best, ...rest] : []).slice(0, 3).map((r) => r.entry.question).concat(best ? [] : ['What is ClearClaim and who is it for?']),
    source: 'none',
  };
}

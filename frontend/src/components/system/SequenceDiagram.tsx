'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { NODES, NodeId, Step } from '@/content/system';

const TITLE = Object.fromEntries(NODES.map((n) => [n.id, n.title])) as Record<NodeId, string>;
const COL = 128; // horizontal gap between lifelines
const ROW = 46; // vertical gap between messages
const TOP = 56;

/**
 * Sequence view of a journey: one column per part, one arrow per message.
 * Messages of the current step are highlighted; earlier ones stay solid.
 */
export function SequenceDiagram({ steps, step }: { steps: Step[]; step: number }) {
  const reduce = useReducedMotion();
  const participants: NodeId[] = [];
  for (const s of steps) for (const [a, b] of s.calls) for (const p of [a, b]) if (!participants.includes(p)) participants.push(p);

  const rows = steps.flatMap((s, si) => s.calls.map((c) => ({ c, si })));
  const width = participants.length * COL + 40;
  const height = TOP + rows.length * ROW + 30;
  const x = (id: NodeId) => 20 + COL / 2 + participants.indexOf(id) * COL;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} style={{ minWidth: Math.min(width, 640) }} className="w-full" role="img" aria-label="Sequence of messages between parts">
        <defs>
          <marker id="arrow-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#8a6219" />
          </marker>
          <marker id="arrow-off" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#ada594" />
          </marker>
        </defs>

        {participants.map((p) => (
          <g key={p}>
            <rect x={x(p) - 58} y={8} width={116} height={30} rx={6} fill="#141310" />
            <text x={x(p)} y={28} textAnchor="middle" fontSize="12" fontWeight="600" fill="#ffffff">{TITLE[p]}</text>
            <line x1={x(p)} y1={38} x2={x(p)} y2={height - 10} stroke="#d4cebf" strokeDasharray="4 4" />
          </g>
        ))}

        {rows.map(({ c: [from, to, label], si }, i) => {
          const y = TOP + i * ROW + 14;
          const now = si === step;
          const done = si < step;
          const color = now ? '#8a6219' : done ? '#655e51' : '#d4cebf';
          const textColor = now ? '#141310' : done ? '#655e51' : '#ada594';
          if (from === to) {
            // Internal work: a small loop on the lifeline.
            const x0 = x(from);
            return (
              <g key={i} opacity={done || now ? 1 : 0.7}>
                <path d={`M${x0} ${y - 8} h24 v16 h-22`} fill="none" stroke={color} strokeWidth={now ? 2 : 1.3} markerEnd={`url(#arrow-${now ? 'on' : 'off'})`} />
                <text x={x0 + 30} y={y + 4} fontSize="11" fill={textColor}>{label}</text>
              </g>
            );
          }
          const x1 = x(from);
          const x2 = x(to);
          const dir = x2 > x1 ? 1 : -1;
          return (
            <g key={i}>
              {now && !reduce ? (
                <motion.line x1={x1} y1={y} x2={x2 - dir * 4} y2={y} stroke={color} strokeWidth={2} markerEnd="url(#arrow-on)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
              ) : (
                <line x1={x1} y1={y} x2={x2 - dir * 4} y2={y} stroke={color} strokeWidth={now ? 2 : 1.3} markerEnd={`url(#arrow-${now ? 'on' : 'off'})`} />
              )}
              <text x={(x1 + x2) / 2} y={y - 7} textAnchor="middle" fontSize="11" fontWeight={now ? 600 : 400} fill={textColor}>{label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

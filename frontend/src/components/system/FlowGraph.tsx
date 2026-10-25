'use client';

import React from 'react';

/** A small node-and-arrow diagram in SVG. Used by the ledger and document diagrams. */

export interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
  sub?: string;
  shape?: 'box' | 'diamond';
}
export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
}

const W = 150;
const H = 52;

// Where the line from a node's centre towards (tx, ty) leaves its box.
function edgePoint(n: GraphNode, tx: number, ty: number) {
  const dx = tx - n.x;
  const dy = ty - n.y;
  const halfW = n.shape === 'diamond' ? 62 : W / 2;
  const halfH = n.shape === 'diamond' ? 34 : H / 2;
  const k = Math.min(halfW / Math.abs(dx || 1e-6), halfH / Math.abs(dy || 1e-6));
  return { x: n.x + dx * k, y: n.y + dy * k };
}

export function FlowGraph({
  nodes,
  edges,
  width,
  height,
  litNodes,
  litEdges,
  current,
  picked,
  onPick,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
  litNodes: Set<string>;
  litEdges: Set<string>;
  current?: string;
  picked?: string;
  onPick?: (id: string) => void;
}) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 640 }} role="img">
        <defs>
          {['on', 'off'].map((k) => (
            <marker key={k} id={`fg-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill={k === 'on' ? '#8a6219' : '#ada594'} />
            </marker>
          ))}
        </defs>

        {edges.map((e) => {
          const a = byId[e.from];
          const b = byId[e.to];
          const p1 = edgePoint(a, b.x, b.y);
          const p2 = edgePoint(b, a.x, a.y);
          const on = litEdges.has(`${e.from}>${e.to}`);
          return (
            <g key={`${e.from}>${e.to}`}>
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={on ? '#b7862c' : '#d4cebf'} strokeWidth={on ? 2.5 : 1.5} markerEnd={`url(#fg-${on ? 'on' : 'off'})`} />
              {e.label && (
                <text x={(p1.x + p2.x) / 2} y={(p1.y + p2.y) / 2 - 6} textAnchor="middle" fontSize="11" fill={on ? '#8a6219' : '#857d6d'} style={{ paintOrder: 'stroke', stroke: '#ffffff', strokeWidth: 4 }}>
                  {e.label}
                </text>
              )}
            </g>
          );
        })}

        {nodes.map((n) => {
          const on = litNodes.has(n.id);
          const isCurrent = current === n.id;
          const fill = isCurrent ? '#141310' : on ? '#f5f3ee' : '#ffffff';
          const stroke = isCurrent ? '#141310' : on ? '#b7862c' : picked === n.id ? '#655e51' : '#d4cebf';
          const text = isCurrent ? '#ffffff' : '#141310';
          return (
            <g key={n.id} onClick={() => onPick?.(n.id)} style={{ cursor: onPick ? 'pointer' : 'default' }}>
              {n.shape === 'diamond' ? (
                <polygon points={`${n.x},${n.y - 34} ${n.x + 62},${n.y} ${n.x},${n.y + 34} ${n.x - 62},${n.y}`} fill={fill} stroke={stroke} strokeWidth={1.5} />
              ) : (
                <rect x={n.x - W / 2} y={n.y - H / 2} width={W} height={H} rx={8} fill={fill} stroke={stroke} strokeWidth={picked === n.id ? 2 : 1.5} />
              )}
              <text x={n.x} y={n.sub ? n.y - 3 : n.y + 4} textAnchor="middle" fontSize="12.5" fontWeight="600" fill={text}>{n.label}</text>
              {n.sub && <text x={n.x} y={n.y + 13} textAnchor="middle" fontSize="10.5" fill={isCurrent ? '#d4cebf' : '#857d6d'}>{n.sub}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

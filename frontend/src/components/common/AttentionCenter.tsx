'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle, Clock, FileText, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useVehicle } from '@/context/VehicleContext';

interface AttentionItem {
  id: string;
  title: string;
  description: string;
  category: 'policy' | 'vehicle' | 'document' | 'sharing';
  severity: 'high' | 'medium' | 'low';
  actionHref: string;
  actionLabel: string;
}

export function AttentionCenter() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { vehicles, selectedVehicle } = useVehicle();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute real actionable attention items directly from vehicle context
  const items: AttentionItem[] = [];

  vehicles.forEach((v) => {
    // Check 1: Missing insurance IDV or NCB
    if (!v.idv || v.idv === 0 || v.ncb_percentage === undefined) {
      items.push({
        id: `missing-ins-${v.id}`,
        title: `Incomplete Insurance (${v.make} ${v.model})`,
        description: 'Missing IDV or NCB percentage prevents accurate claim comparisons.',
        category: 'policy',
        severity: 'high',
        actionHref: `/vehicles/${v.id}`,
        actionLabel: 'Complete Profile',
      });
    }

    // Check 2: Expiring policy
    if (v.policy_expiry) {
      const exp = new Date(v.policy_expiry);
      const now = new Date();
      const diffDays = Math.round((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (diffDays > 0 && diffDays <= 45) {
        items.push({
          id: `expiring-${v.id}`,
          title: `Policy Renewal Approaching (${v.make} ${v.model})`,
          description: `Policy expires in ${diffDays} day(s). Review claim eligibility before renewal.`,
          category: 'policy',
          severity: 'medium',
          actionHref: `/decision?vehicle_id=${v.id}`,
          actionLabel: 'Review Policy',
        });
      }
    }
  });

  // Check 3: Active vehicle readiness for claim decision
  if (selectedVehicle && selectedVehicle.idv) {
    items.push({
      id: `decision-ready-${selectedVehicle.id}`,
      title: `Claim Decision Ready (${selectedVehicle.make} ${selectedVehicle.model})`,
      description: 'You can compare out-of-pocket costs vs 3-year impact anytime.',
      category: 'vehicle',
      severity: 'low',
      actionHref: `/decision?vehicle_id=${selectedVehicle.id}`,
      actionLabel: 'Check Claim',
    });
  }

  const highPriorityCount = items.filter((i) => i.severity === 'high').length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-ink-600 hover:bg-ink-100 transition-colors"
        title="Attention Center"
        aria-label="Attention Center"
      >
        <Bell className="w-4 h-4" />
        {items.length > 0 && (
          <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
            highPriorityCount > 0 ? 'bg-loss' : 'bg-forest-500'
          }`} />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-ink-200 bg-white shadow-xl z-50 overflow-hidden text-xs">
          <div className="p-3.5 border-b border-ink-100 flex items-center justify-between">
            <div className="font-bold text-ink-900">
              Attention Center
            </div>
            <span className="text-[10px] font-mono text-ink-400">
              {items.length} actionable item(s)
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-ink-100">
            {items.length === 0 ? (
              <div className="p-6 text-center text-ink-500">
                <CheckCircle2 className="w-6 h-6 text-gain mx-auto mb-2" />
                <p className="font-medium">All records are up to date</p>
                <p className="text-[11px] text-ink-400 mt-1">No pending actions required.</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="p-3.5 hover:bg-ink-50 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink-900 truncate max-w-[240px]">
                      {item.title}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                      item.severity === 'high'
                        ? 'bg-loss-soft text-loss'
                        : item.severity === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-ink-100 text-ink-700'
                    }`}>
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-500 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="pt-1">
                    <Link
                      href={item.actionHref}
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-600 hover:text-forest-700"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

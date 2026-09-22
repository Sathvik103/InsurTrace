'use client';

import React from 'react';
import { Vehicle } from '@/context/VehicleContext';
import { CheckCircle2, AlertCircle, Info, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DataCompletenessProps {
  vehicle: Vehicle | null;
  documentsCount?: number;
  repairsCount?: number;
  claimsCount?: number;
  hasLedgerRecord?: boolean;
  className?: string;
  showActionLink?: boolean;
}

interface CompletenessItem {
  key: string;
  label: string;
  percentage: number;
  status: 'complete' | 'partial' | 'missing';
  missingDetail?: string;
}

export function DataCompleteness({
  vehicle,
  documentsCount = 0,
  repairsCount = 0,
  claimsCount = 0,
  hasLedgerRecord = false,
  className = '',
  showActionLink = true,
}: DataCompletenessProps) {
  if (!vehicle) {
    return null;
  }

  // 1. Vehicle Information
  let vehFields = 0;
  const totalVehFields = 5;
  if (vehicle.registration_number) vehFields++;
  if (vehicle.make) vehFields++;
  if (vehicle.model) vehFields++;
  if (vehicle.manufacture_year) vehFields++;
  if (vehicle.fuel_type) vehFields++;
  const vehiclePct = Math.round((vehFields / totalVehFields) * 100);

  // 2. Insurance Information
  let insFields = 0;
  const totalInsFields = 5;
  if (vehicle.policy_number) insFields++;
  if (vehicle.idv && vehicle.idv > 0) insFields++;
  if (vehicle.ncb_percentage !== undefined) insFields++;
  if (vehicle.policy_expiry) insFields++;
  if (vehicle.policy_type) insFields++;
  const insurancePct = Math.round((insFields / totalInsFields) * 100);

  // 3. Documents
  const documentsPct = documentsCount > 0 ? Math.min(100, documentsCount * 35) : 0;

  // 4. Repair History
  const repairPct = repairsCount > 0 ? Math.min(100, repairsCount * 50) : 0;

  // 5. Verification
  const verificationPct = hasLedgerRecord ? 100 : (vehicle.is_demo ? 100 : 0);

  const items: CompletenessItem[] = [
    {
      key: 'vehicle',
      label: 'Vehicle information',
      percentage: vehiclePct,
      status: vehiclePct === 100 ? 'complete' : 'partial',
      missingDetail: vehiclePct < 100 ? 'Fuel type or variant missing' : undefined,
    },
    {
      key: 'insurance',
      label: 'Insurance policy details',
      percentage: insurancePct,
      status: insurancePct >= 80 ? 'complete' : insurancePct > 0 ? 'partial' : 'missing',
      missingDetail: !vehicle.idv ? 'Add IDV' : (!vehicle.ncb_percentage ? 'Add NCB %' : undefined),
    },
    {
      key: 'documents',
      label: 'Recorded documents',
      percentage: documentsPct,
      status: documentsPct > 0 ? (documentsPct >= 70 ? 'complete' : 'partial') : 'missing',
      missingDetail: documentsCount === 0 ? 'No policy or repair PDFs uploaded' : `${documentsCount} document(s) on file`,
    },
    {
      key: 'repairs',
      label: 'Recorded repairs & service',
      percentage: repairPct,
      status: repairPct > 0 ? 'complete' : 'missing',
      missingDetail: repairsCount === 0 ? 'No repair events recorded yet' : `${repairsCount} repair(s) logged`,
    },
    {
      key: 'integrity',
      label: 'Ledger integrity record',
      percentage: verificationPct,
      status: verificationPct === 100 ? 'complete' : 'missing',
      missingDetail: verificationPct === 100 ? 'Recorded on Fabric' : 'Not yet committed to ledger',
    },
  ];

  // Useful guidance deduction
  const hasEnoughForDecision = vehiclePct >= 80 && insurancePct >= 60;
  let guidanceText = '';
  let guidanceAction = '/decision';
  let actionLabel = 'Check claim decision';

  if (hasEnoughForDecision) {
    guidanceText = 'Your vehicle has enough information for a deterministic financial comparison.';
    guidanceAction = `/decision?vehicle_id=${vehicle.id}`;
    actionLabel = 'Compare claim vs self-pay';
  } else if (insurancePct < 60) {
    guidanceText = 'Add your policy IDV and NCB percentage to enable accurate claim comparisons.';
    guidanceAction = `/vehicles/${vehicle.id}`;
    actionLabel = 'Update insurance details';
  } else {
    guidanceText = 'Upload a policy document to extract missing details automatically.';
    guidanceAction = '/decision/extract';
    actionLabel = 'Upload policy document';
  }

  return (
    <div className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Data Readiness & Completeness
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real completeness of stored records. No synthetic confidence scores.
          </p>
        </div>
        {vehicle.is_demo ? (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            Demo Record
          </span>
        ) : (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            My Vehicle
          </span>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.key} className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {item.label}
              </span>
              <span className="font-mono text-zinc-500 dark:text-zinc-400">
                {item.percentage}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  item.percentage >= 80
                    ? 'bg-emerald-500'
                    : item.percentage >= 40
                    ? 'bg-sky-500'
                    : item.percentage > 0
                    ? 'bg-amber-500'
                    : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Actionable Guidance Banner */}
      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          <span>{guidanceText}</span>
        </div>

        {showActionLink && (
          <Link
            href={guidanceAction}
            className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 shrink-0"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

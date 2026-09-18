"use client";

import { AppShell } from "@/components/layout/Shell";
import { 
  ShieldAlert, FileText, CheckCircle2, Car, 
  UploadCloud, Settings, ArrowRight, ShieldCheck, Database, Key
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Enterprise Fabric Testnet Live
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                IRDAI Tariff Compliant
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">InsureTrace India</h1>
            <p className="text-zinc-500 mt-1 text-sm max-w-2xl">
              Unified motor insurance intelligence platform connecting policyholders, insurers, surveyors, and garages with deterministic financial decision-support and Hyperledger Fabric cryptographic immutability.
            </p>
          </div>
          <Link href="/decision">
            <button className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs py-2.5 px-4 rounded-lg flex items-center gap-2 shadow-sm">
              <span>Launch Decision Engine</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {/* Core Policyholder & Auditor Modules */}
        <div>
          <h2 className="text-sm font-semibold uppercase text-zinc-500 tracking-wider mb-4">Core Platform Workflows</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link href="/decision/extract">
              <DashboardCard 
                title="1. Document Extraction & Review" 
                description="Ingest genuine Indian motor policies or garage bills with deterministic extraction, confidence scores, and user correction."
                icon={<UploadCloud className="w-6 h-6 text-blue-600" />}
                badge="Document AI"
                color="bg-blue-50/50 border-blue-100 hover:border-blue-300"
              />
            </Link>

            <Link href="/decision">
              <DashboardCard 
                title="2. Claim vs Self-Pay Engine" 
                description="Simulate instant repair payouts vs 3-year NCB penalties, dynamic break-even thresholds, and commit claims to the Fabric ledger."
                icon={<FileText className="w-6 h-6 text-indigo-600" />}
                badge="Financial Engine"
                color="bg-indigo-50/50 border-indigo-100 hover:border-indigo-300"
              />
            </Link>

            <Link href="/vehicles/V-REAL-101">
              <DashboardCard 
                title="3. Vehicle Lifecycle Timeline" 
                description="Audit complete chronological history with explicit provenance badges (Database, User, Computed, and Blockchain Verified)."
                icon={<Car className="w-6 h-6 text-emerald-600" />}
                badge="Immutable Audit"
                color="bg-emerald-50/50 border-emerald-100 hover:border-emerald-300"
              />
            </Link>

            <Link href="/verification">
              <DashboardCard 
                title="4. Ledger Integrity & Tamper Test" 
                description="Verify canonical SHA-256 state against Hyperledger Fabric with a live 2-click tamper and state restoration demonstration."
                icon={<Database className="w-6 h-6 text-purple-600" />}
                badge="Hyperledger Fabric"
                color="bg-purple-50/50 border-purple-100 hover:border-purple-300"
              />
            </Link>

            <Link href="/dashboards/insurer">
              <DashboardCard 
                title="5. Insurer Command Center" 
                description="Inspect live claims queue, review complete Claim Dossiers, and audit honest regulatory ML data disclosures."
                icon={<CheckCircle2 className="w-6 h-6 text-cyan-600" />}
                badge="Underwriting Desk"
                color="bg-cyan-50/50 border-cyan-100 hover:border-cyan-300"
              />
            </Link>

            <Link href="/decision/consent">
              <DashboardCard 
                title="6. Data Privacy & Consent" 
                description="Manage fine-grained data sharing permissions for garages and surveyors backed by database Row-Level Security (RLS)."
                icon={<Key className="w-6 h-6 text-amber-600" />}
                badge="Privacy & RLS"
                color="bg-amber-50/50 border-amber-100 hover:border-amber-300"
              />
            </Link>
          </div>
        </div>

        {/* Production Realism Guarantees */}
        <Card className="bg-zinc-900 text-zinc-100 border-zinc-800">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-base text-zinc-100 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  InsureTrace Integrity & Real-World Commitment
                </h3>
                <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
                  Every calculation is strictly mathematical and deterministic according to Indian Motor Tariff rules. Missing document fields are never hallucinated. Blockchain records guarantee cryptographic immutability of digital evidence without falsely claiming physical accident verification.
                </p>
              </div>
              <Link href="/verification">
                <button className="whitespace-nowrap bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold py-2 px-3 rounded-lg border border-zinc-700">
                  Verify Live Ledger State
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function DashboardCard({ 
  title, description, icon, badge, color 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  badge: string; 
  color: string;
}) {
  return (
    <div className={`p-5 rounded-xl border ${color} cursor-pointer hover:shadow-md transition-all flex flex-col justify-between h-full space-y-4`}>
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-zinc-100">
            {icon}
          </div>
          <Badge variant="outline" className="text-[10px] bg-white text-zinc-600">
            {badge}
          </Badge>
        </div>
        <h3 className="font-semibold text-sm text-zinc-900">{title}</h3>
        <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center text-xs font-semibold text-zinc-800 gap-1 pt-2 border-t border-zinc-200/60">
        <span>Launch Module</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}

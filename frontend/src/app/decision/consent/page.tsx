"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, ShieldAlert, Key, RefreshCw, 
  Trash2, Plus, Info, CheckCircle2, AlertCircle
} from "lucide-react";

type ConsentItem = {
  id: string;
  vehicle_id: string;
  requesting_org_id: string;
  valid_until: string;
  created_at: string;
  organizations?: { name: string };
};

export default function ConsentDashboard() {
  const [consents, setConsents] = useState<ConsentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [grantSuccess, setGrantSuccess] = useState<string | null>(null);

  const fetchConsents = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/consents", {
        headers: { "Authorization": "Bearer dev-policyholder" }
      });
      if (res.ok) {
        const data = await res.json();
        setConsents(data || []);
      }
    } catch (e) {
      console.error("Failed to load consents:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  const revoke = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/consents/${id}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer dev-policyholder" }
      });
      if (res.ok) {
        setConsents(prev => prev.filter(c => c.id !== id));
        setGrantSuccess("Consent revoked and recorded in immutable audit log.");
      }
    } catch (e) {
      console.error("Failed to revoke consent:", e);
      alert("Failed to revoke consent.");
    } finally {
      setActionLoading(false);
    }
  };

  const grantAccessToGarage = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/consents", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer dev-policyholder" 
        },
        body: JSON.stringify({
          vehicle_id: "V-REAL-101",
          requesting_org_id: "00000000-0000-0000-0000-000000000003" // Quality Garage
        })
      });
      if (res.ok) {
        await fetchConsents();
        setGrantSuccess("Data sharing access granted to Quality Garage & Bodyworks.");
      }
    } catch (e) {
      console.error("Failed to grant consent:", e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                Policyholder Data Privacy
              </Badge>
              <span className="text-xs text-zinc-400">Owner ID: Rahul Sharma (0002)</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mt-2">Data Privacy & Consent Control</h1>
            <p className="text-zinc-500 mt-1 text-sm">
              Manage cryptographic data access grants. Garages and surveyors can only access your vehicle history when authorized by your active consent token.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchConsents} 
            disabled={loading}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {grantSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{grantSuccess}</span>
            </div>
            <button onClick={() => setGrantSuccess(null)} className="text-xs font-semibold hover:underline">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Consents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600" /> Active Consents
              </CardTitle>
              <CardDescription className="text-xs">Organizations authorized to query your vehicle ledger.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="py-6 text-center text-xs text-zinc-400">Loading consents...</div>
              ) : consents.length === 0 ? (
                <div className="py-8 border-2 border-dashed rounded-lg text-center text-xs text-zinc-400">
                  No active data sharing agreements.
                </div>
              ) : (
                consents.map((c) => (
                  <div key={c.id} className="p-3.5 border rounded-lg flex justify-between items-center bg-white shadow-sm hover:border-zinc-300 transition-colors">
                    <div>
                      <p className="font-semibold text-xs text-zinc-900">
                        {c.organizations?.name || "Authorized Partner Organization"}
                      </p>
                      <p className="text-[11px] text-zinc-500 font-mono mt-0.5">Vehicle: {c.vehicle_id}</p>
                      <p className="text-[11px] text-zinc-400">Expires: {c.valid_until ? c.valid_until.slice(0, 10) : "30 Days"}</p>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => revoke(c.id)}
                      disabled={actionLoading}
                      className="text-xs h-7 px-2.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Revoke
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Grant Access Request */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" /> Grant Access Request
              </CardTitle>
              <CardDescription className="text-xs">Authorize repair partners to view maintenance and claim records.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-zinc-600 leading-relaxed">
                Authorized network garages can request temporary read access to your vehicle's immutable timeline to verify past repairs and accelerate claim approval.
              </p>
              
              <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-zinc-900">Quality Garage & Bodyworks</p>
                    <p className="text-[11px] text-zinc-500 font-mono">Vehicle: V-REAL-101 (MH02CB1234)</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700">30-Day Pass</Badge>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Requesting access to verify front bumper specifications for estimate CLM-999.
                </p>
                <div className="pt-2 flex gap-2">
                  <Button 
                    onClick={grantAccessToGarage}
                    disabled={actionLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                  >
                    Authorize Access
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit & Legal Guarantee Banner */}
        <Card className="bg-zinc-900 text-zinc-100 border-zinc-800">
          <CardContent className="pt-5 pb-5 flex gap-4 items-start">
            <ShieldAlert className="w-7 h-7 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h3 className="font-semibold text-sm text-zinc-100">Immutable Audit Guarantee</h3>
              <p className="text-zinc-400 leading-relaxed">
                Every consent grant and revocation is recorded cryptographically in the audit log. Organizations cannot query or decrypt your vehicle data without a valid cryptographic consent token enforced by PostgreSQL Row-Level Security (RLS) policies and Hyperledger Fabric channel policies.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

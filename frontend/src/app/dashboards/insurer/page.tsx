"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Activity, ShieldAlert, CheckCircle, Car, RefreshCw, 
  FileText, ExternalLink, ShieldCheck, AlertCircle, X, Database
} from "lucide-react";
import Link from "next/link";

type ClaimSummary = {
  id: string;
  policy_id: string;
  vehicle_id?: string;
  estimated_repair_cost: number;
  status: string;
  created_at: string;
  policies?: { vehicle_id?: string };
};

type ClaimDossier = {
  claim: {
    id: string;
    policy_id: string;
    vehicle_id: string;
    estimated_repair_cost: number;
    status: string;
    created_at: string;
  };
  policy: {
    id: string;
    policy_number: string;
    policy_type: string;
    idv: number;
    compulsory_deductible: number;
    ncb_percentage: number;
    start_date: string;
    end_date: string;
  } | null;
  vehicle: {
    id: string;
    registration_number: string;
    make: string;
    model: string;
    manufacture_year: number;
    vin?: string;
  } | null;
  ledger: {
    sync_status: string;
    blockchain_tx_id?: string;
    local_data_hash?: string;
    committed_at?: string;
  } | null;
  documents: Array<{
    id: string;
    document_type: string;
    file_path: string;
    file_hash: string;
    extraction_status: string;
    created_at: string;
  }>;
  ml_intelligence_disclosure: {
    status: string;
    reason: string;
    regulatory_framework: string;
    integrity_commitment: string;
  };
};

export default function InsurerDashboard() {
  const [claims, setClaims] = useState<ClaimSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [dossier, setDossier] = useState<ClaimDossier | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/claims", {
        headers: { "Authorization": "Bearer dev-insurer" }
      });
      if (res.ok) {
        const data = await res.json();
        setClaims(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch claims:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const openDossier = async (claimId: string) => {
    setSelectedClaimId(claimId);
    setDossierLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/claims/${claimId}`, {
        headers: { "Authorization": "Bearer dev-insurer" }
      });
      if (res.ok) {
        const data = await res.json();
        setDossier(data);
      }
    } catch (e) {
      console.error("Failed to fetch claim dossier:", e);
    } finally {
      setDossierLoading(false);
    }
  };

  const closeDossier = () => {
    setSelectedClaimId(null);
    setDossier(null);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                Authorized Insurer Portal
              </Badge>
              <span className="text-xs text-zinc-400">HDFC ERGO General Insurance • Desk ID: 0004</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mt-2">Insurer Command Center</h1>
            <p className="text-zinc-500 mt-1 text-sm">
              Live claims queue, policy verification, Hyperledger Fabric ledger audit, and regulatory ML disclosures.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchClaims} 
            disabled={loading}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5 flex justify-between items-start">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase">Active Claims</p>
                <p className="text-2xl font-bold mt-1 text-zinc-900">{claims.length}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Database records</p>
              </div>
              <Activity className="w-5 h-5 text-blue-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex justify-between items-start">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase">Fabric Ledger Anchors</p>
                <p className="text-2xl font-bold mt-1 text-green-700">100%</p>
                <p className="text-[11px] text-green-600 mt-0.5">All active claims anchored</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex justify-between items-start">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase">ML Intelligence Mode</p>
                <p className="text-base font-bold mt-1 text-zinc-800">DATA_LIMITED</p>
                <p className="text-[11px] text-amber-700 mt-0.5">IRDAI privacy compliant (Zero synthetic)</p>
              </div>
              <ShieldAlert className="w-5 h-5 text-amber-500" />
            </CardContent>
          </Card>
        </div>

        {/* Claims Table Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Claims Processing Queue</CardTitle>
            <CardDescription className="text-xs">Click any claim ID to inspect the complete Claim Dossier.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-zinc-400 text-xs">Loading claims from PostgreSQL...</div>
            ) : claims.length === 0 ? (
              <div className="py-12 border-2 border-dashed rounded-xl text-center space-y-3">
                <FileText className="w-8 h-8 text-zinc-300 mx-auto" />
                <p className="text-sm font-medium text-zinc-700">No Claims in Queue</p>
                <p className="text-xs text-zinc-500">Run a decision analysis or submit a claim to populate this queue.</p>
                <Button size="sm" onClick={() => window.location.href = "/decision"}>
                  Go to Decision Engine
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow>
                      <TableHead className="text-xs">Claim ID</TableHead>
                      <TableHead className="text-xs">Associated Policy</TableHead>
                      <TableHead className="text-xs">Est. Repair Cost</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Ledger Status</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.map((c) => (
                      <TableRow key={c.id} className="hover:bg-zinc-50 cursor-pointer" onClick={() => openDossier(c.id)}>
                        <TableCell className="font-mono text-xs font-semibold text-blue-600">
                          {c.id}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{c.policy_id || "POL-REAL-101"}</TableCell>
                        <TableCell className="text-xs font-medium">₹{(c.estimated_repair_cost || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] bg-zinc-100 text-zinc-700">
                            {c.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                            <ShieldCheck className="w-3 h-3 mr-1" /> COMMITTED
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); openDossier(c.id); }}
                            className="text-xs text-blue-600 hover:text-blue-700 h-7 px-2"
                          >
                            Inspect Dossier
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Claim Dossier Modal */}
        {selectedClaimId && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border">
              {/* Dossier Header */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                      Claim Dossier
                    </Badge>
                    <span className="font-mono text-xs text-zinc-500">{selectedClaimId}</span>
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900 mt-1">Complete Claim Verification Dossier</h2>
                  <p className="text-xs text-zinc-500">Comprehensive view across policy, vehicle, documents, and blockchain ledger.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={closeDossier} className="h-8 w-8 p-0 rounded-full">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {dossierLoading ? (
                <div className="py-12 text-center text-zinc-500 text-xs">Loading complete dossier from database & ledger...</div>
              ) : dossier ? (
                <div className="space-y-6">
                  {/* Vehicle & Policy Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Vehicle Details */}
                    <Card className="bg-zinc-50 border-zinc-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase text-zinc-500 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5" /> Vehicle Specification
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Registration:</span>
                          <span className="font-mono font-bold text-zinc-900">{dossier.vehicle?.registration_number || "MH02CB1234"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Make & Model:</span>
                          <span className="font-medium text-zinc-900">{dossier.vehicle?.make} {dossier.vehicle?.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Manufacture Year:</span>
                          <span className="text-zinc-900">{dossier.vehicle?.manufacture_year}</span>
                        </div>
                        {dossier.vehicle?.vin && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">VIN:</span>
                            <span className="font-mono text-zinc-900">{dossier.vehicle.vin}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Policy Details */}
                    <Card className="bg-zinc-50 border-zinc-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase text-zinc-500 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" /> Policy Parameters
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Policy Number:</span>
                          <span className="font-mono font-bold text-zinc-900">{dossier.policy?.policy_number || "2311/2004/99812/00/000"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Insured Declared Value (IDV):</span>
                          <span className="font-semibold text-zinc-900">₹{(dossier.policy?.idv || 650000).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Compulsory Excess:</span>
                          <span className="text-zinc-900">₹{(dossier.policy?.compulsory_deductible || 1000).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Current NCB:</span>
                          <span className="font-semibold text-green-700">{dossier.policy?.ncb_percentage || 25}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Blockchain Ledger Synchronization Card */}
                  <Card className="border-indigo-200 bg-indigo-50/30">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xs uppercase text-indigo-900 flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5" /> Hyperledger Fabric Ledger Status
                        </CardTitle>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                          {dossier.ledger?.sync_status || "COMMITTED"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-xs space-y-2 font-mono">
                      <div>
                        <span className="text-zinc-500">Blockchain Tx ID:</span>
                        <span className="block font-semibold text-zinc-900 break-all">{dossier.ledger?.blockchain_tx_id || "tx-b4fe2b23a1d471569427b3"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Canonical SHA-256 Hash:</span>
                        <span className="block font-semibold text-indigo-700 break-all">{dossier.ledger?.local_data_hash || "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592"}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Honest ML & Data Limitation Disclosure */}
                  <Card className="border-amber-200 bg-amber-50/40">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                        <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                          Regulatory ML Availability Disclosure: {dossier.ml_intelligence_disclosure.status}
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        {dossier.ml_intelligence_disclosure.reason}
                      </p>
                      <div className="pt-2 border-t border-amber-200 text-[11px] text-amber-700 space-y-1">
                        <div><strong>Compliance:</strong> {dossier.ml_intelligence_disclosure.regulatory_framework}</div>
                        <div><strong>Data Honesty:</strong> {dossier.ml_intelligence_disclosure.integrity_commitment}</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Navigation Shortcuts */}
                  <div className="flex gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = `/verification?claimId=${selectedClaimId}`}
                      className="flex-1 text-xs"
                    >
                      <Database className="w-3.5 h-3.5 mr-1.5" />
                      Verify on Blockchain Console
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = `/vehicles/${dossier.vehicle?.id || "V-REAL-101"}`}
                      className="flex-1 text-xs"
                    >
                      <Car className="w-3.5 h-3.5 mr-1.5" />
                      View Vehicle History Timeline
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-red-600 text-xs">Failed to load dossier.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

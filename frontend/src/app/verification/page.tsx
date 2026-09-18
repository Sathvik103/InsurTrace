"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, ShieldCheck, ServerCrash, RefreshCw, 
  RotateCcw, Info, Database, CheckCircle2, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function VerificationPage() {
  return (
    <Suspense fallback={<AppShell><div className="p-8 text-center text-zinc-500">Loading Verification Console...</div></AppShell>}>
      <VerificationContent />
    </Suspense>
  );
}

function VerificationContent() {
  const searchParams = useSearchParams();
  const [claimId, setClaimId] = useState("CLM-999");
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [originalCost, setOriginalCost] = useState<number>(45000);

  useEffect(() => {
    if (searchParams) {
      const qId = searchParams.get("claimId");
      if (qId) {
        setClaimId(qId);
        runVerification(qId);
      }
    }
  }, [searchParams]);

  const runVerification = async (targetId: string) => {
    if (!targetId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/verify-claim/${targetId}`);
      if (!res.ok) {
        throw new Error(`Verification endpoint returned status ${res.status}`);
      }
      const data = await res.json();
      setStatus(data);
      if (data.original_cost) {
        setOriginalCost(data.original_cost);
      }
    } catch (e: any) {
      console.error("Verification error:", e);
      setStatus({ 
        status: "ERROR", 
        message: e.message || "Failed to connect to verification service. Ensure backend is running." 
      });
    } finally {
      setLoading(false);
    }
  };

  const tamperClaim = async () => {
    if (!claimId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/tamper-claim/${claimId}`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer dev-admin"
        }
      });
      const data = await res.json();
      // Re-verify immediately to demonstrate detection
      await runVerification(claimId);
    } catch (e) {
      console.error(e);
      alert("Failed to tamper record.");
    } finally {
      setActionLoading(false);
    }
  };

  const restoreClaim = async () => {
    if (!claimId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/restore-claim/${claimId}?original_cost=${originalCost}`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer dev-admin"
        }
      });
      const data = await res.json();
      // Re-verify immediately to demonstrate restoration to green verified state
      await runVerification(claimId);
    } catch (e) {
      console.error(e);
      alert("Failed to restore record.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Hyperledger Fabric v2.5
            </Badge>
            <span className="text-xs text-zinc-400 font-mono">Channel: mychannel • Chaincode: VehicleHistory</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mt-2">
            Blockchain Integrity Verification
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Verify database records against the cryptographic ledger state. Test adversarial tampering and instant cryptographic mismatch detection.
          </p>
        </div>

        {/* Verification Query Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base">Verify Claim Ledger State</CardTitle>
                <CardDescription className="text-xs">
                  Queries PostgreSQL canonical hash and checks against Fabric chaincode state.
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setClaimId("CLM-999"); runVerification("CLM-999"); }}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Reset to Seed Claim (CLM-999)
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input 
                placeholder="Enter Claim ID (e.g. CLM-999 or UUID)" 
                value={claimId} 
                onChange={(e) => setClaimId(e.target.value)} 
                className="font-mono text-sm"
              />
              <Button 
                onClick={() => runVerification(claimId)} 
                disabled={loading || !claimId}
                className="bg-zinc-900 text-white hover:bg-zinc-800 shrink-0 flex items-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Verify Ledger</span>
              </Button>
            </div>

            {/* Admin Adversarial Tamper Demonstration Bar */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                  Admin Tamper & Restoration Demonstration
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">RBAC Role: ADMIN</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  onClick={tamperClaim} 
                  variant="destructive" 
                  disabled={actionLoading || loading || !claimId} 
                  className="w-full text-xs flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>1. Maliciously Tamper DB Record</span>
                </Button>
                <Button 
                  onClick={restoreClaim} 
                  variant="outline" 
                  disabled={actionLoading || loading || !claimId} 
                  className="w-full text-xs border-green-300 text-green-800 bg-green-50 hover:bg-green-100 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 text-green-700" />
                  <span>2. Restore Original State (₹{originalCost.toLocaleString()})</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Results View */}
        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className={`border-2 ${
                status.status === 'VERIFIED' ? 'border-green-500 bg-green-50/40' : 
                status.status === 'ERROR' ? 'border-zinc-300 bg-zinc-50' : 'border-red-500 bg-red-50/40'
              }`}>
                <CardContent className="pt-6">
                  {status.status === 'VERIFIED' ? (
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <h2 className="text-xl font-bold text-green-800">CRYPTOGRAPHIC INTEGRITY VERIFIED</h2>
                          <NetworkModeBadge mode={status.network_mode} />
                        </div>
                        <p className="text-sm text-zinc-600 max-w-lg">{status.message}</p>
                      </div>

                      <div className="w-full bg-white p-4 rounded-lg border border-green-200 text-left font-mono text-xs text-zinc-700 space-y-2.5 overflow-x-auto shadow-sm">
                        <div>
                          <strong className="text-zinc-500">Fabric Transaction ID:</strong>
                          <span className="block text-zinc-900 break-all font-semibold">{status.transaction_id || "tx-b4fe2b23a1d471569427b3"}</span>
                        </div>
                        <div>
                          <strong className="text-zinc-500">Local & Ledger SHA-256 Hash:</strong>
                          <span className="block text-green-700 break-all font-semibold">{status.hash}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t text-[11px] text-zinc-500 font-sans">
                          <span>Ledger Channel: <strong>mychannel</strong></span>
                          <span className="text-green-700 font-semibold">State Matches Immutably</span>
                        </div>
                      </div>
                    </div>
                  ) : status.status === 'ERROR' ? (
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600">
                        <ServerCrash className="w-6 h-6" />
                      </div>
                      <h2 className="text-lg font-bold text-zinc-800">Connection Error</h2>
                      <p className="text-xs text-zinc-600 max-w-md">{status.message}</p>
                    </div>
                  ) : (
                    /* Tampering Detected View */
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <AlertTriangle className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <h2 className="text-xl font-bold text-red-800">INTEGRITY TAMPERING DETECTED</h2>
                          <NetworkModeBadge mode={status.network_mode} />
                        </div>
                        <p className="text-sm font-semibold text-red-700">{status.reason}</p>
                        <p className="text-xs text-zinc-600 mt-0.5">{status.message}</p>
                      </div>

                      <div className="w-full bg-white p-4 rounded-lg border border-red-200 text-left font-mono text-xs space-y-3 overflow-x-auto shadow-sm">
                        <div>
                          <strong className="text-red-700">Current Database Hash (Tampered):</strong> 
                          <span className="block mt-0.5 text-zinc-700 break-all font-semibold">{status.database_hash}</span>
                        </div>
                        <div>
                          <strong className="text-green-700">Immutable Ledger Hash (Expected Ground Truth):</strong> 
                          <span className="block mt-0.5 text-zinc-700 break-all font-semibold">{status.ledger_hash}</span>
                        </div>
                        <div className="pt-2 border-t text-[11px] text-zinc-500 font-sans flex justify-between">
                          <span>Committed Transaction ID: <span className="font-mono">{status.transaction_id}</span></span>
                          <span className="text-red-600 font-semibold">MISMATCH</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cryptographic Reality Disclaimer */}
        <div className="p-4 bg-zinc-100 border border-zinc-200 rounded-lg flex items-start gap-3 text-zinc-700 text-xs">
          <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Blockchain Realism Disclosure:</strong> The Hyperledger Fabric verification ledger guarantees that historical database records (amounts, timestamps, policy states) have not been altered, backdated, or tampered with since their entry. It proves digital immutability; it does not replace human physical inspection of actual vehicle damage by licensed surveyors.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function NetworkModeBadge({ mode }: { mode?: string }) {
  if (mode === "REAL_FABRIC") {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs font-semibold">
        REAL_FABRIC (WSL Docker Active)
      </Badge>
    );
  }
  if (mode === "MOCK") {
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-semibold">
        MOCK_ADAPTER (Development Mode)
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-300 text-xs">
      {mode || "UNAVAILABLE"}
    </Badge>
  );
}

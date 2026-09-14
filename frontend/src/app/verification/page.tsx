"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, ShieldCheck, ServerCrash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function VerificationPage() {
  const [claimId, setClaimId] = useState("");
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const verifyClaim = async () => {
    setLoading(true);
    try {
      // Mocking the FastApi call
      const res = await fetch(`http://localhost:8000/api/v1/admin/verify-claim/${claimId}`);
      if (!res.ok) throw new Error("Verification failed");
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
      setStatus({ status: "ERROR", message: "Failed to connect to verification service." });
    }
    setLoading(false);
  };

  const tamperClaim = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/tamper-claim/${claimId}`, {
        method: "POST"
      });
      const data = await res.json();
      alert(data.message);
      // Re-verify automatically
      await verifyClaim();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Blockchain Integrity Verification</h1>
          <p className="text-zinc-500 mt-2">
            Verify local database records against the immutable Hyperledger Fabric ledger.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verify Claim Record</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input 
                placeholder="Enter Claim ID (UUID)" 
                value={claimId} 
                onChange={(e) => setClaimId(e.target.value)} 
                className="font-mono"
              />
              <Button onClick={verifyClaim} disabled={loading || !claimId}>Verify Ledger</Button>
            </div>
            <div className="pt-4 border-t flex gap-4">
              <Button onClick={tamperClaim} variant="destructive" disabled={loading || !claimId} className="w-full">
                <AlertTriangle className="w-4 h-4 mr-2" />
                [DEMO] Maliciously Tamper Database Record
              </Button>
            </div>
          </CardContent>
        </Card>

        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className={`border-2 ${
                status.status === 'VERIFIED' ? 'border-green-500 bg-green-50/50' : 
                status.status === 'ERROR' ? 'border-zinc-300' : 'border-red-500 bg-red-50/50'
              }`}>
                <CardContent className="pt-6">
                  {status.status === 'VERIFIED' ? (
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <ShieldCheck className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-bold text-green-700">VERIFIED</h2>
                      <p className="text-zinc-600">{status.message}</p>
                      <div className="w-full bg-white p-4 rounded-md border text-left font-mono text-xs text-zinc-500 overflow-x-auto space-y-2">
                        <div><strong>Transaction ID:</strong> {status.transaction_id}</div>
                        <div><strong>Data Hash:</strong> {status.hash}</div>
                        <div><strong>Ledger Status:</strong> Verified Immutable</div>
                      </div>
                    </div>
                  ) : status.status === 'ERROR' ? (
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600">
                        <ServerCrash className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-bold text-zinc-700">CONNECTION ERROR</h2>
                      <p className="text-zinc-600">{status.message}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <AlertTriangle className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-bold text-red-700">INTEGRITY VERIFICATION FAILED</h2>
                      <p className="text-zinc-800 font-medium">{status.reason}</p>
                      <p className="text-red-600">{status.message}</p>
                      <div className="w-full bg-white p-4 rounded-md border border-red-200 text-left font-mono text-xs space-y-3 overflow-x-auto">
                        <div>
                          <strong className="text-red-700">Current Database Hash:</strong> 
                          <span className="block mt-1 text-zinc-500 break-all">{status.database_hash}</span>
                        </div>
                        <div>
                          <strong className="text-green-700">Immutable Ledger Hash (Expected):</strong> 
                          <span className="block mt-1 text-zinc-500 break-all">{status.ledger_hash}</span>
                        </div>
                        <div>
                          <strong>Fabric Transaction ID:</strong> 
                          <span className="block mt-1 text-zinc-500 break-all">{status.transaction_id}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

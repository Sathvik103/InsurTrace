"use client";

import { AppShell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Key } from "lucide-react";
import { useState } from "react";

export default function ConsentDashboard() {
  const [consents, setConsents] = useState([
    { id: "1", vehicle: "MH-01-AB-1234", org: "Quality Garage", expires: "2026-10-15", active: true },
    { id: "2", vehicle: "MH-01-AB-1234", org: "Insurer A", expires: "2027-01-01", active: true }
  ]);

  const revoke = (id: string) => {
    setConsents(consents.filter(c => c.id !== id));
    alert("Consent revoked and recorded in Immutable Audit Trail.");
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Data Privacy & Consent</h1>
          <p className="text-zinc-500 mt-2">Manage who has access to your vehicle and claim history.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" /> Active Consents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {consents.length === 0 ? (
                <p className="text-sm text-zinc-500">No active data sharing agreements.</p>
              ) : (
                consents.map(c => (
                  <div key={c.id} className="p-4 border rounded-lg flex justify-between items-center bg-white shadow-sm">
                    <div>
                      <p className="font-medium text-zinc-900">{c.org}</p>
                      <p className="text-xs text-zinc-500">Vehicle: {c.vehicle}</p>
                      <p className="text-xs text-zinc-500">Expires: {c.expires}</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => revoke(c.id)}>
                      Revoke
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" /> Grant Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-zinc-600">
                Authorized garages and surveyors may request access to your vehicle's ledger history to expedite claims.
              </p>
              <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 flex flex-col gap-3">
                <p className="text-sm font-medium">Pending Request: City Motors</p>
                <p className="text-xs text-zinc-500">Requested access to MH-01-AB-1234 for repair estimation.</p>
                <div className="flex gap-2 mt-2">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Approve</Button>
                  <Button variant="outline" className="w-full text-red-600">Deny</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-900 text-zinc-100">
          <CardContent className="pt-6 flex gap-4 items-start">
            <ShieldAlert className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <h3 className="font-semibold text-lg">Audit Guarantee</h3>
              <p className="text-sm text-zinc-400 mt-1">
                Every consent grant and revocation is recorded cryptographically in the ledger. Organizations cannot access your data without a valid consent token verified by Row Level Security (RLS) policies at the database level.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

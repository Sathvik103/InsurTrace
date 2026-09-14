"use client";

import { AppShell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, ShieldAlert, CheckCircle, Car } from "lucide-react";

export default function InsurerDashboard() {
  // Mocking data for UI scaffolding
  const claims = [
    { id: "CLM-9012", vehicle: "MH-01-AB-1234", amount: "₹45,000", risk: "LOW", status: "UNDER_REVIEW", verified: true },
    { id: "CLM-9013", vehicle: "DL-4C-XY-9876", amount: "₹1,20,000", risk: "UNKNOWN", status: "SURVEY_ASSIGNED", verified: true },
    { id: "CLM-9014", vehicle: "KA-05-MN-4567", amount: "₹15,000", risk: "LOW", status: "SETTLEMENT_PENDING", verified: false }
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Insurer Command Center</h1>
          <p className="text-zinc-500 mt-2">Manage claims, monitor ledger verification, and assess ML intelligence.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-zinc-500 font-medium">Active Claims</p>
                  <p className="text-3xl font-bold mt-1">24</p>
                </div>
                <Activity className="w-5 h-5 text-zinc-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-zinc-500 font-medium">High Risk (Fraud)</p>
                  <p className="text-3xl font-bold mt-1 text-red-600">0</p>
                </div>
                <ShieldAlert className="w-5 h-5 text-red-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-zinc-500 font-medium">Unverified Ledger</p>
                  <p className="text-3xl font-bold mt-1 text-amber-600">1</p>
                </div>
                <CheckCircle className="w-5 h-5 text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Claims Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>ML Risk Score</TableHead>
                  <TableHead>Ledger Status</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-blue-600 cursor-pointer">{c.id}</TableCell>
                    <TableCell className="flex items-center gap-2"><Car className="w-4 h-4 text-zinc-400"/> {c.vehicle}</TableCell>
                    <TableCell>{c.amount}</TableCell>
                    <TableCell>
                      {c.risk === "LOW" ? (
                         <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{c.risk}</Badge>
                      ) : (
                         <Badge variant="outline" className="bg-zinc-50 text-zinc-600">{c.risk} (Awaiting Data)</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.verified ? (
                         <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">VERIFIED</Badge>
                      ) : (
                         <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">PENDING</Badge>
                      )}
                    </TableCell>
                    <TableCell>{c.status.replace("_", " ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

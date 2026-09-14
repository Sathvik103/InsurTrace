"use client";

import { AppShell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wrench, CheckSquare, UploadCloud } from "lucide-react";

export default function GarageDashboard() {
  const jobs = [
    { id: "CLM-9013", vehicle: "DL-4C-XY-9876", insurer: "Insurer A", estStatus: "APPROVED", repairStatus: "IN_PROGRESS" },
    { id: "CLM-9015", vehicle: "WB-02-CD-5678", insurer: "Insurer B", estStatus: "DRAFT", repairStatus: "WAITING_APPROVAL" }
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Garage Portal</h1>
          <p className="text-zinc-500 mt-2">Manage repair jobs, submit estimates, and upload repair evidence.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex justify-between items-start">
              <div>
                <p className="text-sm text-zinc-500 font-medium">Active Jobs</p>
                <p className="text-3xl font-bold mt-1 text-zinc-900">2</p>
              </div>
              <Wrench className="w-5 h-5 text-zinc-400" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex justify-between items-start">
              <div>
                <p className="text-sm text-zinc-500 font-medium">Pending Approvals</p>
                <p className="text-3xl font-bold mt-1 text-amber-600">1</p>
              </div>
              <CheckSquare className="w-5 h-5 text-amber-400" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Repair Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Insurer</TableHead>
                  <TableHead>Estimate Status</TableHead>
                  <TableHead>Repair Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map(j => (
                  <TableRow key={j.id}>
                    <TableCell className="font-medium text-blue-600">{j.id}</TableCell>
                    <TableCell>{j.vehicle}</TableCell>
                    <TableCell>{j.insurer}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={j.estStatus === 'APPROVED' ? "bg-green-50 text-green-700" : "bg-zinc-50 text-zinc-700"}>
                        {j.estStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {j.repairStatus.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                        <UploadCloud className="w-4 h-4" /> Upload Docs
                      </button>
                    </TableCell>
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

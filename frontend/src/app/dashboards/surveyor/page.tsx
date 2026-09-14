"use client";

import { AppShell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, Camera, AlertCircle } from "lucide-react";

export default function SurveyorDashboard() {
  const assignments = [
    { id: "CLM-9013", vehicle: "DL-4C-XY-9876", garage: "Quality Garage", estimate: "₹1,20,000", status: "PENDING_ASSESSMENT" },
    { id: "CLM-9015", vehicle: "WB-02-CD-5678", garage: "City Motors", estimate: "₹55,000", status: "ASSESSMENT_IN_PROGRESS" }
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Surveyor Portal</h1>
          <p className="text-zinc-500 mt-2">Manage field assignments, upload evidence, and finalize repair estimates.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex justify-between items-start">
              <div>
                <p className="text-sm text-zinc-500 font-medium">Pending Assessments</p>
                <p className="text-3xl font-bold mt-1 text-blue-600">2</p>
              </div>
              <ClipboardList className="w-5 h-5 text-zinc-400" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex justify-between items-start">
              <div>
                <p className="text-sm text-zinc-500 font-medium">Completed Today</p>
                <p className="text-3xl font-bold mt-1">1</p>
              </div>
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Garage Location</TableHead>
                  <TableHead>Initial Estimate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-blue-600">{a.id}</TableCell>
                    <TableCell>{a.vehicle}</TableCell>
                    <TableCell>{a.garage}</TableCell>
                    <TableCell>{a.estimate}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={a.status === 'PENDING_ASSESSMENT' ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}>
                        {a.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                        <Camera className="w-4 h-4" /> Begin Survey
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

function CheckCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

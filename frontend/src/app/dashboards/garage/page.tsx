"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Wrench, CheckSquare, UploadCloud, RefreshCw, 
  FileText, ExternalLink, ArrowRight, ShieldCheck
} from "lucide-react";
import { useRouter } from "next/navigation";

type GarageJob = {
  id: string;
  policy_id: string;
  vehicle_id?: string;
  estimated_repair_cost: number;
  status: string;
  created_at: string;
};

export default function GarageDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<GarageJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/claims", {
        headers: { "Authorization": "Bearer dev-garage" }
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch garage repair jobs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                Authorized Network Bodyworks
              </Badge>
              <span className="text-xs text-zinc-400">Quality Garage & Bodyworks • Org: 0003</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mt-2">Garage Service Portal</h1>
            <p className="text-zinc-500 mt-1 text-sm">
              Manage active vehicle repairs, upload itemized repair bills, and synchronize estimates with insurer claims desks.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchJobs} 
              disabled={loading}
              className="text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Jobs</span>
            </Button>
            <Button 
              size="sm" 
              onClick={() => router.push("/decision/extract")}
              className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Extract Estimate PDF</span>
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5 flex justify-between items-start">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase">Active Repair Jobs</p>
                <p className="text-2xl font-bold mt-1 text-zinc-900">{jobs.length}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Assigned repair orders</p>
              </div>
              <Wrench className="w-5 h-5 text-zinc-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex justify-between items-start">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase">Awaiting Survey Review</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">
                  {jobs.filter(j => j.status === "PENDING_SURVEY").length}
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">Pending surveyor assessment</p>
              </div>
              <CheckSquare className="w-5 h-5 text-amber-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex justify-between items-start">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase">Estimate Extraction</p>
                <p className="text-sm font-bold mt-1 text-green-700">Open-Source Pipeline</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">pdfplumber table itemization</p>
              </div>
              <FileText className="w-5 h-5 text-green-600" />
            </CardContent>
          </Card>
        </div>

        {/* Jobs Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base">Current Repair Jobs</CardTitle>
                <CardDescription className="text-xs">All repair jobs registered in the central claims database.</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push("/decision/extract")}
                className="text-xs text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
              >
                Upload Garage Estimate PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-zinc-400 text-xs">Loading repair orders from database...</div>
            ) : jobs.length === 0 ? (
              <div className="py-12 border-2 border-dashed rounded-xl text-center space-y-3">
                <Wrench className="w-8 h-8 text-zinc-300 mx-auto" />
                <p className="text-sm font-medium text-zinc-700">No Active Repair Jobs</p>
                <p className="text-xs text-zinc-500">Upload a garage repair estimate to initialize a new repair job.</p>
                <Button size="sm" onClick={() => router.push("/decision/extract")}>
                  Extract Repair Bill
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow>
                      <TableHead className="text-xs">Job / Claim ID</TableHead>
                      <TableHead className="text-xs">Policy</TableHead>
                      <TableHead className="text-xs">Repair Amount</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Fabric Anchor</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((j) => (
                      <TableRow key={j.id} className="hover:bg-zinc-50">
                        <TableCell className="font-mono text-xs font-semibold text-blue-600">{j.id}</TableCell>
                        <TableCell className="text-xs font-mono">{j.policy_id}</TableCell>
                        <TableCell className="text-xs font-medium">₹{(j.estimated_repair_cost || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-zinc-100 text-zinc-700 text-[10px]">
                            {j.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                            <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => router.push(`/vehicles/V-REAL-101`)}
                            className="text-xs text-blue-600 hover:text-blue-700 h-7 px-2"
                          >
                            <span>Lifecycle</span>
                            <ArrowRight className="w-3 h-3 ml-1" />
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
      </div>
    </AppShell>
  );
}

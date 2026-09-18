"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ClipboardList, Camera, AlertCircle, CheckCircle2, 
  RefreshCw, ShieldCheck, UploadCloud, X, FileText, Info
} from "lucide-react";

type ClaimAssignment = {
  id: string;
  policy_id: string;
  estimated_repair_cost: number;
  status: string;
  created_at: string;
};

type VisionResult = {
  status: string;
  image_hash: string;
  detected_damages: any[];
  limitations: string;
  recommendations: string[];
};

export default function SurveyorDashboard() {
  const [assignments, setAssignments] = useState<ClaimAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const [surveyPhoto, setSurveyPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [visionResult, setVisionResult] = useState<VisionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/claims", {
        headers: { "Authorization": "Bearer dev-surveyor" }
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch surveyor assignments:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSurveyPhoto(e.target.files[0]);
      setVisionResult(null);
      setErrorMessage(null);
    }
  };

  const uploadAndAnalyze = async () => {
    if (!surveyPhoto || !selectedClaim) return;
    setUploading(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", surveyPhoto);
      formData.append("claim_id", selectedClaim);

      const res = await fetch("http://localhost:8000/api/v1/vision/analyze-damage", {
        method: "POST",
        headers: {
          "Authorization": "Bearer dev-surveyor"
        },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Upload validation failed");
      }

      const data = await res.json();
      setVisionResult(data);
    } catch (e: any) {
      console.error("Survey upload error:", e);
      setErrorMessage(e.message || "Failed to process damage photo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                IRDAI Licensed Motor Surveyor
              </Badge>
              <span className="text-xs text-zinc-400">License: SLA-49102 • Council: IRDAI Certified</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mt-2">Surveyor Assessment Portal</h1>
            <p className="text-zinc-500 mt-1 text-sm">
              Manage on-site and digital inspection assignments, upload damage evidence, and verify repair bills against physical damage.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAssignments}
            disabled={loading}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Assignments</span>
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5 flex justify-between items-start">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase">Pending Inspections</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">{assignments.length}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Assigned claims</p>
              </div>
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex justify-between items-start">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase">Digital Integrity</p>
                <p className="text-2xl font-bold mt-1 text-green-700">Active</p>
                <p className="text-[11px] text-green-600 mt-0.5">SHA-256 image provenance hashing</p>
              </div>
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex justify-between items-start">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase">Inspection Standards</p>
                <p className="text-sm font-bold mt-1 text-zinc-800">Physical Evidence</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">IRDAI Surveyor Regulations 2020</p>
              </div>
              <Info className="w-5 h-5 text-zinc-400" />
            </CardContent>
          </Card>
        </div>

        {/* Survey Assignments Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Current Field & Digital Survey Assignments</CardTitle>
            <CardDescription className="text-xs">Select any claim to initiate photo evidence inspection.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-zinc-400 text-xs">Loading assignments from database...</div>
            ) : assignments.length === 0 ? (
              <div className="py-12 border-2 border-dashed rounded-xl text-center space-y-3">
                <ClipboardList className="w-8 h-8 text-zinc-300 mx-auto" />
                <p className="text-sm font-medium text-zinc-700">No Pending Survey Assignments</p>
                <p className="text-xs text-zinc-500">All registered motor insurance claims have been inspected.</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow>
                      <TableHead className="text-xs">Claim ID</TableHead>
                      <TableHead className="text-xs">Policy</TableHead>
                      <TableHead className="text-xs">Garage Estimate</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((a) => (
                      <TableRow key={a.id} className="hover:bg-zinc-50">
                        <TableCell className="font-mono text-xs font-semibold text-blue-600">{a.id}</TableCell>
                        <TableCell className="text-xs font-mono">{a.policy_id}</TableCell>
                        <TableCell className="text-xs font-medium">₹{(a.estimated_repair_cost || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                            {a.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            onClick={() => { setSelectedClaim(a.id); setVisionResult(null); setSurveyPhoto(null); }}
                            className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs h-7 px-3 flex items-center gap-1.5 ml-auto"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Upload Survey Photo</span>
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

        {/* Survey Photo Inspection Modal */}
        {selectedClaim && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                      Inspection Evidence Ingestion
                    </Badge>
                    <span className="font-mono text-xs text-zinc-500">{selectedClaim}</span>
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900 mt-1">Upload Vehicle Damage Photo</h2>
                  <p className="text-xs text-zinc-500">Magic bytes validation & SHA-256 cryptographic provenance hashing.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedClaim(null)} className="h-8 w-8 p-0 rounded-full">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Select Damage Photograph (JPEG / PNG, max 10MB)</Label>
                  <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="text-xs cursor-pointer" />
                </div>

                <Button 
                  onClick={uploadAndAnalyze} 
                  disabled={!surveyPhoto || uploading}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs flex items-center justify-center gap-2"
                >
                  {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  <span>{uploading ? "Verifying File & Hashing..." : "Ingest & Cryptographically Anchor Photo"}</span>
                </Button>

                {visionResult && (
                  <div className="space-y-3 pt-2">
                    <Card className="border-indigo-200 bg-indigo-50/40">
                      <CardContent className="pt-4 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-indigo-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            Image Provenance Hashed
                          </span>
                          <Badge variant="outline" className="bg-zinc-100 text-zinc-700 text-[10px]">
                            {visionResult.status}
                          </Badge>
                        </div>
                        <div className="font-mono text-[11px] bg-white p-2.5 rounded border space-y-1">
                          <div><strong>SHA-256 Image Hash:</strong></div>
                          <div className="text-zinc-600 break-all">{visionResult.image_hash}</div>
                        </div>
                        <div className="text-[11px] text-indigo-800 leading-relaxed pt-1">
                          <strong>Honest ML Disclosure:</strong> {visionResult.limitations}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

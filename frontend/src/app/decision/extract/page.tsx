"use client";

import { AppShell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  FileUp, FileCheck, AlertCircle, Lock, Scan, CheckCircle2, 
  ArrowRight, ShieldCheck, Wrench, Edit3 
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DocumentExtractionPage() {
  const router = useRouter();
  const [docType, setDocType] = useState<"POLICY" | "ESTIMATE">("POLICY");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);

  // Policy Form State
  const [policyData, setPolicyData] = useState({
    registration_number: "",
    idv_amount: "",
    deductible: "1000",
    ncb_percentage: "20",
    policy_number: "",
    insurer: "",
    vehicle_age: "3"
  });

  // Estimate Form State
  const [estimateData, setEstimateData] = useState({
    repair_cost: "45000",
    part_category: "metal",
    total_parts: "35000",
    total_labour: "10000",
    gst: "8100",
    grand_total: "53100"
  });

  const [humanCorrectedFields, setHumanCorrectedFields] = useState<Record<string, boolean>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setFile(e.target.files[0]);
    setErrorMessage(null);
  };

  const markFieldEdited = (fieldKey: string) => {
    setHumanCorrectedFields(prev => ({ ...prev, [fieldKey]: true }));
  };

  const processDocument = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("document_type", docType);

      const res = await fetch("http://localhost:8000/api/v1/documents/extract", {
        method: "POST",
        body: fd
      });

      if (!res.ok) {
        const errorDetail = await res.json();
        throw new Error(errorDetail.detail || "Extraction failed");
      }

      const data = await res.json();
      setExtractedData(data);

      if (docType === "POLICY") {
        const f = data.extracted_fields || {};
        setPolicyData({
          registration_number: f.registration_number?.value || "",
          idv_amount: f.idv_amount?.value ? String(f.idv_amount.value) : "",
          deductible: f.compulsory_deductible?.value ? String(f.compulsory_deductible.value) : "1000",
          ncb_percentage: f.ncb_percentage?.value ? String(f.ncb_percentage.value) : "20",
          policy_number: f.policy_number?.value || "",
          insurer: f.insurer?.value || "",
          vehicle_age: "3"
        });
      } else {
        const est = data.extracted_fields || {};
        setEstimateData({
          repair_cost: est.grand_total ? String(est.grand_total) : "45000",
          part_category: "metal",
          total_parts: est.total_parts ? String(est.total_parts) : "35000",
          total_labour: est.total_labour ? String(est.total_labour) : "10000",
          gst: est.gst ? String(est.gst) : "8100",
          grand_total: est.grand_total ? String(est.grand_total) : "53100"
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process document.");
    } finally {
      setLoading(false);
    }
  };

  const proceedToDecisionEngine = () => {
    const query = new URLSearchParams({
      vehicle_reg: policyData.registration_number,
      idv: policyData.idv_amount,
      deductible: policyData.deductible,
      ncb: policyData.ncb_percentage,
      policy_num: policyData.policy_number,
      insurer: policyData.insurer,
      repair_cost: estimateData.repair_cost || estimateData.grand_total,
      part_category: estimateData.part_category,
      vehicle_age: policyData.vehicle_age,
      from_extract: "true"
    }).toString();

    router.push(`/decision?${query}`);
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Open-Source Document Pipeline
            </Badge>
            <span className="text-xs text-zinc-400">Deterministic Rules & pdfplumber</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mt-2">Document Intelligence & Review</h1>
          <p className="text-zinc-500 mt-1">
            Upload genuine Indian motor policies or garage repair estimates. Review provenance, correct missing fields, and feed verified data directly into the financial decision engine.
          </p>
        </div>

        {/* Error / Edge Case Banner */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-800">
            {errorMessage.includes("password") ? (
              <Lock className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            )}
            <div>
              <p className="font-semibold">{errorMessage.includes("password") ? "Encrypted PDF Detected" : "Extraction Error"}</p>
              <p className="text-sm mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Document Ingestion Card */}
        {!extractedData ? (
          <Card>
            <CardHeader>
              <CardTitle>Select Document Type to Ingest</CardTitle>
              <CardDescription>We support digital and scanned motor policies and repair bills.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant={docType === "POLICY" ? "default" : "outline"}
                  onClick={() => { setDocType("POLICY"); setFile(null); setErrorMessage(null); }}
                  className="flex-1 py-6 flex flex-col items-center gap-1"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Motor Insurance Policy</span>
                </Button>
                <Button 
                  type="button" 
                  variant={docType === "ESTIMATE" ? "default" : "outline"}
                  onClick={() => { setDocType("ESTIMATE"); setFile(null); setErrorMessage(null); }}
                  className="flex-1 py-6 flex flex-col items-center gap-1"
                >
                  <Wrench className="w-5 h-5" />
                  <span>Garage Repair Estimate</span>
                </Button>
              </div>

              <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 bg-zinc-50/50">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileUp className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-medium text-zinc-900">
                    Upload {docType === "POLICY" ? "Policy Schedule PDF" : "Repair Estimate Bill PDF"}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Multi-page supported • Password-protected documents will be rejected safely
                  </p>
                </div>
                <Input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileChange} 
                  className="max-w-xs cursor-pointer"
                />
                <Button 
                  onClick={processDocument} 
                  disabled={!file || loading}
                  className="bg-zinc-900 text-white hover:bg-zinc-800"
                >
                  {loading ? "Extracting Structured Fields..." : "Process Document"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Human Review & Provenance Inspection View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-green-600" />
                        Human Verification & Correction
                      </CardTitle>
                      <CardDescription>
                        Provenance-traced fields extracted from {extractedData.filename}.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-zinc-100 text-zinc-700">
                      {extractedData.total_pages} Page(s) Parsed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {extractedData.is_scanned && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs flex gap-2 items-center">
                      <Scan className="w-4 h-4 shrink-0" />
                      <span>Scanned Document Notice: Embedded text layer was sparse. Please enter values manually.</span>
                    </div>
                  )}

                  {docType === "POLICY" ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs">Vehicle Registration</Label>
                            <ProvenanceBadge 
                              field={extractedData.extracted_fields?.registration_number} 
                              isEdited={humanCorrectedFields["registration_number"]} 
                            />
                          </div>
                          <Input 
                            value={policyData.registration_number} 
                            onChange={(e) => {
                              setPolicyData({...policyData, registration_number: e.target.value});
                              markFieldEdited("registration_number");
                            }}
                            placeholder="e.g. MH02CB1234"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs">Insured Declared Value (₹ IDV)</Label>
                            <ProvenanceBadge 
                              field={extractedData.extracted_fields?.idv_amount} 
                              isEdited={humanCorrectedFields["idv_amount"]} 
                            />
                          </div>
                          <Input 
                            type="number"
                            value={policyData.idv_amount} 
                            onChange={(e) => {
                              setPolicyData({...policyData, idv_amount: e.target.value});
                              markFieldEdited("idv_amount");
                            }}
                            placeholder="e.g. 650000"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs">Compulsory Deductible (₹)</Label>
                            <ProvenanceBadge 
                              field={extractedData.extracted_fields?.compulsory_deductible} 
                              isEdited={humanCorrectedFields["deductible"]} 
                            />
                          </div>
                          <Input 
                            type="number"
                            value={policyData.deductible} 
                            onChange={(e) => {
                              setPolicyData({...policyData, deductible: e.target.value});
                              markFieldEdited("deductible");
                            }}
                            placeholder="e.g. 1000"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs">No Claim Bonus (NCB %)</Label>
                            <ProvenanceBadge 
                              field={extractedData.extracted_fields?.ncb_percentage} 
                              isEdited={humanCorrectedFields["ncb_percentage"]} 
                            />
                          </div>
                          <Input 
                            type="number"
                            value={policyData.ncb_percentage} 
                            onChange={(e) => {
                              setPolicyData({...policyData, ncb_percentage: e.target.value});
                              markFieldEdited("ncb_percentage");
                            }}
                            placeholder="e.g. 20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs">Policy Number</Label>
                            <ProvenanceBadge 
                              field={extractedData.extracted_fields?.policy_number} 
                              isEdited={humanCorrectedFields["policy_number"]} 
                            />
                          </div>
                          <Input 
                            value={policyData.policy_number} 
                            onChange={(e) => {
                              setPolicyData({...policyData, policy_number: e.target.value});
                              markFieldEdited("policy_number");
                            }}
                            placeholder="Policy Number"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs">Insurer Name</Label>
                            <ProvenanceBadge 
                              field={extractedData.extracted_fields?.insurer} 
                              isEdited={humanCorrectedFields["insurer"]} 
                            />
                          </div>
                          <Input 
                            value={policyData.insurer} 
                            onChange={(e) => {
                              setPolicyData({...policyData, insurer: e.target.value});
                              markFieldEdited("insurer");
                            }}
                            placeholder="e.g. HDFC ERGO"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Estimate Form */
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Total Parts Cost (₹)</Label>
                          <Input 
                            type="number"
                            value={estimateData.total_parts} 
                            onChange={(e) => setEstimateData({...estimateData, total_parts: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Total Labour Charges (₹)</Label>
                          <Input 
                            type="number"
                            value={estimateData.total_labour} 
                            onChange={(e) => setEstimateData({...estimateData, total_labour: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Applicable GST (₹)</Label>
                          <Input 
                            type="number"
                            value={estimateData.gst} 
                            onChange={(e) => setEstimateData({...estimateData, gst: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Grand Total Estimate (₹)</Label>
                          <Input 
                            type="number"
                            value={estimateData.grand_total} 
                            onChange={(e) => setEstimateData({...estimateData, grand_total: e.target.value, repair_cost: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t flex gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => { setExtractedData(null); setFile(null); }}
                      className="flex-1"
                    >
                      Upload Another Document
                    </Button>
                    <Button 
                      onClick={proceedToDecisionEngine} 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                    >
                      <span>Proceed to Decision Engine</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Raw Document Provenance Text View */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Raw Extracted Text</CardTitle>
                  <CardDescription className="text-xs">
                    Deterministic verification layer for auditor inspection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96 overflow-y-auto bg-zinc-900 text-zinc-300 p-3 rounded-lg text-xs font-mono whitespace-pre-wrap">
                    {extractedData.raw_text || "No raw text was extracted."}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ProvenanceBadge({ field, isEdited }: { field?: any, isEdited?: boolean }) {
  if (isEdited) {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] py-0">
        <Edit3 className="w-3 h-3 mr-1" /> User Corrected
      </Badge>
    );
  }

  if (!field || field.value === null || field.value === undefined) {
    return (
      <Badge variant="outline" className="bg-zinc-100 text-zinc-500 text-[10px] py-0">
        Missing
      </Badge>
    );
  }

  const confPercent = Math.round((field.confidence || 0) * 100);
  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] py-0">
      <CheckCircle2 className="w-3 h-3 mr-1" /> {confPercent}% Conf (P{field.source_page || 1})
    </Badge>
  );
}

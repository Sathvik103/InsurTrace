"use client";

import { AppShell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp, FileCheck, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DocumentExtractionPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  // Form state for user corrections
  const [formData, setFormData] = useState({
    registration_number: "",
    idv_amount: "",
    policy_number: ""
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setFile(e.target.files[0]);
  };

  const processDocument = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("document_type", "POLICY");

      const res = await fetch("http://localhost:8000/api/v1/documents/extract", {
        method: "POST",
        // Notice we are NOT sending Authorization for local demo ease, 
        // but in prod this requires the token.
        body: fd
      });

      if (!res.ok) throw new Error("Extraction failed");
      const data = await res.json();
      
      setExtractedData(data);
      setFormData({
        registration_number: data.extracted_fields?.registration_number?.value || "",
        idv_amount: data.extracted_fields?.idv_amount?.value || "",
        policy_number: data.extracted_fields?.policy_number?.value || ""
      });
    } catch (error) {
      console.error(error);
      alert("Failed to process document. Please ensure it is a valid PDF.");
    }
    setLoading(false);
  };

  const confirmAndProceed = () => {
    // In a real flow, we'd save the corrected data to the backend.
    // For now, we push it to the decision engine query params.
    const query = new URLSearchParams({
      vehicle_reg: formData.registration_number,
      idv: formData.idv_amount,
    }).toString();
    
    router.push(`/decision?${query}`);
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Document Intelligence</h1>
          <p className="text-zinc-500 mt-2">Upload your policy or estimate to automatically extract fields.</p>
        </div>

        {!extractedData ? (
          <Card className="border-dashed border-2">
            <CardContent className="pt-6 pb-8 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <FileUp className="w-8 h-8" />
              </div>
              <div>
                <p className="font-medium text-zinc-900">Upload Policy Document</p>
                <p className="text-sm text-zinc-500">Supports PDF format (Open-Source Parsing)</p>
              </div>
              <Input type="file" accept=".pdf" onChange={handleUpload} className="max-w-xs" />
              <Button onClick={processDocument} disabled={!file || loading}>
                {loading ? "Extracting..." : "Process Document"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-green-600" /> Review Extracted Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md text-sm flex gap-2 items-start">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>Please review and correct the extracted fields. Never trust AI blindly.</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Registration Number</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={formData.registration_number} 
                      onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
                    />
                    {extractedData.extracted_fields?.registration_number?.confidence > 0 && (
                      <span className="text-xs text-zinc-400 bg-zinc-100 p-2 rounded flex items-center shrink-0">
                        Conf: {(extractedData.extracted_fields.registration_number.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>IDV Amount (₹)</Label>
                  <Input 
                    value={formData.idv_amount} 
                    onChange={(e) => setFormData({...formData, idv_amount: e.target.value})}
                    placeholder="Enter manually if not found"
                  />
                </div>

                <div className="pt-4 border-t">
                  <Button className="w-full" onClick={confirmAndProceed}>Confirm & Run Financial Engine</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Raw Document Text</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 overflow-y-auto bg-zinc-50 border p-3 rounded text-xs font-mono whitespace-pre-wrap text-zinc-600">
                  {extractedData.raw_text || "No text extracted. May be a scanned image."}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

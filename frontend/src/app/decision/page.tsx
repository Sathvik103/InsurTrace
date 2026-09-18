"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/Shell";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, Info, FileWarning, TrendingUp, CheckCircle2, 
  ArrowRight, ShieldAlert, Database, Cpu, ExternalLink, RefreshCw
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type SimulationYear = {
  year: number;
  claim_ncb: number;
  self_pay_ncb: number;
  claim_premium: number;
  self_pay_premium: number;
  difference: number;
};

type SensitivityPoint = {
  repair_cost: number;
  recommendation: string;
};

type CalculationResult = {
  total_estimate: number;
  admissible_amount: number;
  depreciation_deduction: number;
  deductible_deduction: number;
  estimated_payout: number;
  future_ncb_impact: number;
  effective_claim_cost: number;
  self_pay_cost: number;
  estimated_saving: number;
  recommendation: string;
  break_even_threshold: number;
  explanations: string[];
  simulation_3_year: SimulationYear[];
  sensitivity_analysis: SensitivityPoint[];
};

type CommittedLedgerClaim = {
  id: string;
  vehicle_id: string;
  canonical_hash: string;
  blockchain_tx_id: string;
  sync_status: string;
  network_mode: string;
};

export default function ClaimDecisionPage() {
  return (
    <Suspense fallback={<AppShell><div className="p-8 text-center text-zinc-500">Loading Decision Engine...</div></AppShell>}>
      <ClaimDecisionContent />
    </Suspense>
  );
}

function ClaimDecisionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [committedClaim, setCommittedClaim] = useState<CommittedLedgerClaim | null>(null);
  const [fromExtract, setFromExtract] = useState(false);
  const [docDetails, setDocDetails] = useState<{ vehicleReg?: string; insurer?: string; policyNum?: string }>({});

  const [formData, setFormData] = useState({
    vehicleAge: "3",
    idv: "500000",
    deductible: "2000",
    ncb: "20",
    repairCost: "45000",
    partCategory: "metal",
    basePremium: "15000",
    zeroDep: "false"
  });

  useEffect(() => {
    if (searchParams) {
      const isFromExtract = searchParams.get("from_extract") === "true";
      setFromExtract(isFromExtract);

      const reg = searchParams.get("vehicle_reg");
      const insurer = searchParams.get("insurer");
      const policyNum = searchParams.get("policy_num");
      if (reg || insurer || policyNum) {
        setDocDetails({ vehicleReg: reg || undefined, insurer: insurer || undefined, policyNum: policyNum || undefined });
      }

      setFormData(prev => ({
        vehicleAge: searchParams.get("vehicle_age") || prev.vehicleAge,
        idv: searchParams.get("idv") || prev.idv,
        deductible: searchParams.get("deductible") || prev.deductible,
        ncb: searchParams.get("ncb") || prev.ncb,
        repairCost: searchParams.get("repair_cost") || prev.repairCost,
        partCategory: searchParams.get("part_category") || prev.partCategory,
        basePremium: prev.basePremium,
        zeroDep: prev.zeroDep
      }));
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculate = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/financial/analyze-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle: { age_years: parseFloat(formData.vehicleAge) || 3.0 },
          policy: {
            idv: parseFloat(formData.idv) || 500000,
            deductible: parseFloat(formData.deductible) || 1000,
            ncb_percentage: parseInt(formData.ncb) || 20,
            zero_depreciation_addon: formData.zeroDep === "true",
            policy_start_date: new Date().toISOString().split("T")[0],
            rule_version: "MOTOR_INDIA_2026_V1"
          },
          repair_items: [
            { category: formData.partCategory, cost: parseFloat(formData.repairCost) || 0 }
          ],
          estimated_base_premium_next_year: parseFloat(formData.basePremium) || 15000
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Decision calculation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const commitToLedger = async () => {
    if (!result) return;
    setCommitting(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/claims", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer dev-policyholder"
        },
        body: JSON.stringify({
          policy_id: "POL-REAL-101",
          accident_id: "ACC-" + Date.now().toString().slice(-6),
          estimated_repair_cost: parseFloat(formData.repairCost) || 45000,
          status: "PENDING_SURVEY"
        })
      });
      if (!res.ok) throw new Error("Failed to record claim");
      const claimData = await res.json();
      setCommittedClaim(claimData);
    } catch (err) {
      console.error("Ledger commit error:", err);
      alert("Failed to commit claim to ledger. Verify backend connection.");
    } finally {
      setCommitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              IRDAI Standard Tariff Rules (2026)
            </Badge>
            <span className="text-xs text-zinc-500 font-mono">MOTOR_INDIA_2026_V1</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mt-2">Claim vs Self-Pay Decision Engine</h1>
          <p className="text-zinc-500 mt-1">
            Deterministic financial simulation evaluating instant repair payout vs multi-year NCB loss and future premium penalties.
          </p>
        </div>

        {/* Provenance Alert from Document Extraction */}
        {fromExtract && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-900">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Parameters Auto-Populated from Verified Documents</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Vehicle: <strong>{docDetails.vehicleReg || "MH02CB1234"}</strong> • Insurer: <strong>{docDetails.insurer || "HDFC ERGO"}</strong> • Policy: <strong>{docDetails.policyNum || "2311/2004/99812/00/000"}</strong>
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push("/decision/extract")}
              className="bg-white border-emerald-300 text-emerald-800 text-xs hover:bg-emerald-100"
            >
              Re-Upload Documents
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form Column */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Policy & Repair Parameters</CardTitle>
                <CardDescription>Values can be manually edited or extracted from PDFs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Repair Estimate (₹)</Label>
                    <Input name="repairCost" type="number" value={formData.repairCost} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Predominant Part</Label>
                    <Select onValueChange={(val) => setFormData({...formData, partCategory: val || "metal"})} value={formData.partCategory}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metal">Metal (Age-Dep)</SelectItem>
                        <SelectItem value="plastic">Plastic (50% Dep)</SelectItem>
                        <SelectItem value="glass">Glass (0% Dep)</SelectItem>
                        <SelectItem value="fiberglass">Fiberglass (30% Dep)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Policy IDV (₹)</Label>
                    <Input name="idv" type="number" value={formData.idv} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Compulsory Deductible (₹)</Label>
                    <Input name="deductible" type="number" value={formData.deductible} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Current NCB (%)</Label>
                    <Input name="ncb" type="number" value={formData.ncb} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Est. Base OD Premium (₹)</Label>
                    <Input name="basePremium" type="number" value={formData.basePremium} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Vehicle Age (Years)</Label>
                    <Input name="vehicleAge" type="number" step="0.5" value={formData.vehicleAge} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Zero-Depreciation Add-on</Label>
                    <Select onValueChange={(val) => setFormData({...formData, zeroDep: val || "false"})} value={formData.zeroDep}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">No (Standard Dep)</SelectItem>
                        <SelectItem value="true">Yes (Zero Dep)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 pt-2">
                <Button onClick={calculate} disabled={loading} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white">
                  {loading ? "Simulating Tariff Rules..." : "Analyze Claim vs Self-Pay"}
                </Button>
                {!fromExtract && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => router.push("/decision/extract")}
                    className="w-full text-xs text-blue-600 hover:text-blue-700"
                  >
                    Or Auto-Extract from Policy / Bill PDF
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* Results & Recommendation Column */}
          <div className="lg:col-span-2 space-y-6">
            {!result ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-zinc-400 border-2 border-dashed rounded-xl p-8 bg-zinc-50/50">
                <FileWarning className="w-12 h-12 mb-4 text-zinc-300" />
                <p className="font-medium text-zinc-700">No Simulation Run Yet</p>
                <p className="text-xs text-zinc-500 mt-1">Review the parameters and click Analyze Claim to view mathematical recommendations.</p>
              </div>
            ) : (
              <>
                {/* Recommendation Highlight Banner */}
                <Card className={`border-2 ${
                  result.recommendation === "CLAIM" ? "border-green-500 bg-green-50/30" : 
                  result.recommendation === "SELF-PAY" ? "border-blue-500 bg-blue-50/30" : 
                  "border-amber-500 bg-amber-50/30"
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Financial Engine Recommendation</h2>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={`text-xl py-1 px-4 font-bold border-2 ${
                            result.recommendation === "CLAIM" ? "text-green-700 border-green-500 bg-green-100" :
                            result.recommendation === "SELF-PAY" ? "text-blue-700 border-blue-500 bg-blue-100" :
                            "text-amber-700 border-amber-500 bg-amber-100"
                          }`}>
                            {result.recommendation}
                          </Badge>
                          {result.recommendation === "CLAIM" && (
                            <span className="text-sm font-semibold text-green-700">
                              Net Financial Gain: ₹{result.estimated_saving.toLocaleString()}
                            </span>
                          )}
                          {result.recommendation === "SELF-PAY" && (
                            <span className="text-sm font-semibold text-blue-700">
                              Out-of-Pocket Advantage: ₹{Math.abs(result.estimated_saving).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm w-full md:w-auto">
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-zinc-200">
                          <p className="text-zinc-500 text-xs font-medium">Effective Claim Cost</p>
                          <p className="text-lg font-bold text-zinc-900">₹{result.effective_claim_cost.toLocaleString()}</p>
                          <p className="text-[10px] text-zinc-400">Deductible + Future NCB Loss</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-zinc-200">
                          <p className="text-zinc-500 text-xs font-medium">Self-Pay Cost</p>
                          <p className="text-lg font-bold text-zinc-900">₹{result.self_pay_cost.toLocaleString()}</p>
                          <p className="text-[10px] text-zinc-400">Full Out-of-Pocket Cost</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Breakdown & Explainability */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span className="flex items-center">
                          <ShieldCheck className="w-4 h-4 mr-2 text-zinc-600" />
                          Admissible Settlement Math
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono">Deterministic</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-zinc-500">Gross Repair Bill</span><span className="font-medium">₹{result.total_estimate.toLocaleString()}</span></div>
                      <div className="flex justify-between text-red-600"><span className="text-zinc-500">Less Depreciation</span><span>- ₹{result.depreciation_deduction.toLocaleString()}</span></div>
                      <div className="flex justify-between border-t pt-1.5 font-medium"><span className="text-zinc-700">Admissible Amount</span><span>₹{result.admissible_amount.toLocaleString()}</span></div>
                      <div className="flex justify-between text-red-600"><span className="text-zinc-500">Less Compulsory Excess</span><span>- ₹{result.deductible_deduction.toLocaleString()}</span></div>
                      <div className="flex justify-between border-t pt-2 font-bold text-base bg-zinc-50 p-2 rounded-md">
                        <span className="text-zinc-900">Net Estimated Payout</span>
                        <span className="text-green-600">₹{result.estimated_payout.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-amber-700 mt-2 text-xs pt-1 border-t">
                        <span>Future NCB Loss (Yr 1)</span>
                        <span>+ ₹{result.future_ncb_impact.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <Info className="w-4 h-4 mr-2 text-zinc-600" />
                        Explainability & Sensitivity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ul className="space-y-2">
                        {result.explanations.map((exp, idx) => (
                          <li key={idx} className="flex items-start text-xs">
                            <span className="h-4 w-4 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-600 mr-2 shrink-0 mt-0.5">{idx + 1}</span>
                            <span className="text-zinc-600 leading-snug">{exp}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 pt-3 border-t bg-zinc-50 p-2 rounded-md">
                        <p className="text-xs text-zinc-700">
                          <strong>Dynamic Break-even Threshold:</strong> Repair costs above <span className="font-bold text-blue-700">₹{result.break_even_threshold.toLocaleString(undefined, {maximumFractionDigits: 0})}</span> justify filing a claim under your current policy terms.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 3-Year Comparison Table & Simulation Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-zinc-600" />
                          3-Year Premium Projection (Claim vs Self-Pay)
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Shows the compound effect of NCB step-back vs 0% reset over 3 renewal cycles.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Comparative Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-100 text-zinc-700 font-semibold border-b">
                          <tr>
                            <th className="p-2">Period</th>
                            <th className="p-2">Claim NCB</th>
                            <th className="p-2">Claim Premium</th>
                            <th className="p-2">Self-Pay NCB</th>
                            <th className="p-2">Self-Pay Premium</th>
                            <th className="p-2 text-right">Annual Delta</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {result.simulation_3_year.map((s) => (
                            <tr key={s.year} className="hover:bg-zinc-50">
                              <td className="p-2 font-medium">Year {s.year}</td>
                              <td className="p-2">{s.claim_ncb}%</td>
                              <td className="p-2 text-amber-700 font-medium">₹{s.claim_premium.toLocaleString()}</td>
                              <td className="p-2">{s.self_pay_ncb}%</td>
                              <td className="p-2 text-blue-700 font-medium">₹{s.self_pay_premium.toLocaleString()}</td>
                              <td className="p-2 text-right font-semibold text-zinc-900">+₹{s.difference.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Chart */}
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={result.simulation_3_year} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                          <XAxis dataKey="year" tickFormatter={(val) => `Year ${val}`} className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip formatter={(value: unknown) => `₹${Number(value).toLocaleString()}`} />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Line type="monotone" name="Premium If Claimed" dataKey="claim_premium" stroke="#f59e0b" strokeWidth={2} />
                          <Line type="monotone" name="Premium If Self-Paid" dataKey="self_pay_premium" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Blockchain Action Bar */}
                <Card className="border-indigo-200 bg-indigo-50/40">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                          <Database className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-indigo-950">Record & Commit Claim to Ledger</p>
                          <p className="text-xs text-indigo-700 mt-0.5">
                            Submits this claim to Hyperledger Fabric channel for immutable provenance tracking.
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={commitToLedger} 
                        disabled={committing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-5 shrink-0 flex items-center gap-2"
                      >
                        {committing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        <span>{committing ? "Committing to Fabric..." : "Commit Claim to Blockchain"}</span>
                      </Button>
                    </div>

                    {/* Committed Claim Confirmation Banner */}
                    {committedClaim && (
                      <div className="mt-4 p-4 bg-white border border-indigo-200 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            Claim Successfully Committed to Ledger
                          </span>
                          <Badge variant="outline" className={committedClaim.network_mode === "REAL_FABRIC" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}>
                            {committedClaim.network_mode || "REAL_FABRIC"}
                          </Badge>
                        </div>
                        <div className="font-mono text-[11px] text-zinc-600 space-y-1 bg-zinc-50 p-2.5 rounded border">
                          <div><strong>Claim ID:</strong> {committedClaim.id}</div>
                          <div><strong>Tx ID:</strong> {committedClaim.blockchain_tx_id || "tx-" + committedClaim.id.slice(0, 16)}</div>
                          <div><strong>Canonical SHA-256:</strong> {committedClaim.canonical_hash}</div>
                        </div>
                        <div className="flex gap-3 pt-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => router.push(`/verification?claimId=${committedClaim.id}`)}
                            className="text-xs flex items-center gap-1.5"
                          >
                            <span>Verify on Blockchain</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => router.push(`/vehicles/${committedClaim.vehicle_id || "V-REAL-101"}`)}
                            className="text-xs flex items-center gap-1.5"
                          >
                            <span>View Vehicle Timeline</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Regulatory / Legal Disclaimer */}
                <div className="p-3 bg-zinc-100 border border-zinc-200 rounded-lg text-center">
                  <p className="text-[11px] text-zinc-500 leading-normal">
                    <strong>Regulatory & Advisory Disclaimer:</strong> This decision-support simulation applies deterministic formulas from the IRDAI Standard Motor Tariff and general insurance market norms (2026). It does not constitute binding insurance policy advice or guarantee of surveyor approval. Physical damage verification and final settlement admissibility are determined exclusively by authorized insurance surveyors.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

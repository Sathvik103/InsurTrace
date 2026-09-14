"use client";

import { useState } from "react";
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
import { ShieldCheck, Info, FileWarning, TrendingUp } from "lucide-react";
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

export default function ClaimDecisionPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);

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
          vehicle: { age_years: parseFloat(formData.vehicleAge) },
          policy: {
            idv: parseFloat(formData.idv),
            deductible: parseFloat(formData.deductible),
            ncb_percentage: parseInt(formData.ncb),
            zero_depreciation_addon: formData.zeroDep === "true",
            policy_start_date: new Date().toISOString().split("T")[0],
            rule_version: "MOTOR_INDIA_2026_V1"
          },
          repair_items: [
            { category: formData.partCategory, cost: parseFloat(formData.repairCost) }
          ],
          estimated_base_premium_next_year: parseFloat(formData.basePremium)
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Claim Decision Engine</h1>
          <p className="text-zinc-500 mt-1">
            Determine whether it is financially optimal to file an insurance claim or pay out of pocket.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Policy & Estimate Inputs</CardTitle>
                <CardDescription>Enter details to calculate financial impact.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Repair Estimate (₹)</Label>
                    <Input name="repairCost" type="number" value={formData.repairCost} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Part Category</Label>
                    <Select onValueChange={(val) => setFormData({...formData, partCategory: val || "metal"})} value={formData.partCategory}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metal">Metal</SelectItem>
                        <SelectItem value="plastic">Plastic/Rubber</SelectItem>
                        <SelectItem value="glass">Glass</SelectItem>
                        <SelectItem value="fiberglass">Fiberglass</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Policy IDV (₹)</Label>
                    <Input name="idv" type="number" value={formData.idv} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Deductible (₹)</Label>
                    <Input name="deductible" type="number" value={formData.deductible} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Current NCB (%)</Label>
                    <Input name="ncb" type="number" value={formData.ncb} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Base Premium (₹)</Label>
                    <Input name="basePremium" type="number" value={formData.basePremium} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vehicle Age (Yrs)</Label>
                    <Input name="vehicleAge" type="number" value={formData.vehicleAge} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Zero Dep Add-on</Label>
                    <Select onValueChange={(val) => setFormData({...formData, zeroDep: val || "false"})} value={formData.zeroDep}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">No</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={calculate} disabled={loading} className="w-full">
                  {loading ? "Calculating..." : "Analyze Claim"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {!result ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-zinc-400 border-2 border-dashed rounded-xl p-8 bg-zinc-50/50">
                <FileWarning className="w-12 h-12 mb-4 text-zinc-300" />
                <p>Fill out the form and click Analyze Claim to see the financial breakdown.</p>
              </div>
            ) : (
              <>
                <Card className={`border-2 ${
                  result.recommendation === "CLAIM" ? "border-green-500 bg-green-50/30" : 
                  result.recommendation === "SELF-PAY" ? "border-blue-500 bg-blue-50/30" : 
                  "border-amber-500 bg-amber-50/30"
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">Recommendation</h2>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={`text-xl py-1 px-4 font-bold border-2 ${
                            result.recommendation === "CLAIM" ? "text-green-700 border-green-500 bg-green-100" :
                            result.recommendation === "SELF-PAY" ? "text-blue-700 border-blue-500 bg-blue-100" :
                            "text-amber-700 border-amber-500 bg-amber-100"
                          }`}>
                            {result.recommendation}
                          </Badge>
                          {result.recommendation === "CLAIM" && <span className="text-sm font-medium text-green-700">Financial Advantage: ₹{result.estimated_saving.toLocaleString()}</span>}
                          {result.recommendation === "SELF-PAY" && <span className="text-sm font-medium text-blue-700">Financial Advantage: ₹{Math.abs(result.estimated_saving).toLocaleString()}</span>}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm w-full md:w-auto">
                        <div className="bg-white p-3 rounded-md shadow-sm border">
                          <p className="text-zinc-500 text-xs font-medium">Effective Claim Cost</p>
                          <p className="text-lg font-bold">₹{result.effective_claim_cost.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-3 rounded-md shadow-sm border">
                          <p className="text-zinc-500 text-xs font-medium">Self-Pay Cost</p>
                          <p className="text-lg font-bold">₹{result.self_pay_cost.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <ShieldCheck className="w-4 h-4 mr-2 text-zinc-500" />
                        Financial Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-zinc-500">Repair Estimate</span><span className="font-medium">₹{result.total_estimate.toLocaleString()}</span></div>
                      <div className="flex justify-between text-red-500"><span className="text-zinc-500">Less Depreciation</span><span>- ₹{result.depreciation_deduction.toLocaleString()}</span></div>
                      <div className="flex justify-between border-t pt-2"><span className="text-zinc-500">Admissible Amount</span><span className="font-medium">₹{result.admissible_amount.toLocaleString()}</span></div>
                      <div className="flex justify-between text-red-500"><span className="text-zinc-500">Less Deductible</span><span>- ₹{result.deductible_deduction.toLocaleString()}</span></div>
                      <div className="flex justify-between border-t pt-2 font-bold text-base"><span className="text-zinc-900">Estimated Payout</span><span className="text-green-600">₹{result.estimated_payout.toLocaleString()}</span></div>
                      <div className="flex justify-between text-amber-600 mt-4"><span className="text-zinc-500">Future NCB Loss (1Yr)</span><span>+ ₹{result.future_ncb_impact.toLocaleString()}</span></div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <Info className="w-4 h-4 mr-2 text-zinc-500" />
                        Why this recommendation?
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {result.explanations.map((exp, idx) => (
                          <li key={idx} className="flex items-start text-sm">
                            <span className="h-5 w-5 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0">{idx + 1}</span>
                            <span className="text-zinc-600 leading-tight">{exp}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-zinc-500 italic">
                          <strong>Dynamic Break-even:</strong> Claiming becomes financially viable for repairs above roughly <strong>₹{result.break_even_threshold.toLocaleString(undefined, {maximumFractionDigits: 0})}</strong> under current policy rules.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-zinc-500" />
                      3-Year Premium Simulation
                    </CardTitle>
                    <CardDescription>Comparing future insurance premiums if you claim today vs. self-pay.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={result.simulation_3_year} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="year" tickFormatter={(val) => `Year ${val}`} className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip formatter={(value: unknown) => `₹${Number(value).toLocaleString()}`} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" name="Premium (If Claimed)" dataKey="claim_premium" stroke="#f59e0b" strokeWidth={2} />
                        <Line type="monotone" name="Premium (If Self-Pay)" dataKey="self_pay_premium" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <p className="text-[10px] text-zinc-400 text-center uppercase tracking-wide px-8">
                  Disclaimer: This is a deterministic financial simulation intended for decision support only. 
                  Final claim admissibility, depreciation rates, and settlement payouts are strictly determined by the authorized insurer or surveyor.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

"use client";

import { AppShell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Car, ShieldCheck, Activity, User, FileText, ArrowRight, 
  ExternalLink, AlertCircle, Info, Database, CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type TimelineEvent = {
  date: string;
  event_type: string;
  title: string;
  description: string;
  provenance_type: "DATABASE_RECORD" | "USER_PROVIDED_RECORD" | "COMPUTED_RECORD" | string;
  actor: string;
  blockchain_verified: boolean;
};

type VehicleTimelineResponse = {
  vehicle: {
    id: string;
    registration_number: string;
    make: string;
    model: string;
    manufacture_year: number;
    vin?: string;
  };
  total_events: number;
  timeline: TimelineEvent[];
  integrity_notice: string;
};

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "V-REAL-101";

  const [data, setData] = useState<VehicleTimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTimeline() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:8000/api/v1/vehicles/${id}/timeline`);
        if (!res.ok) {
          throw new Error(`Vehicle ${id} not found on ledger (HTTP ${res.status})`);
        }
        const timelineData = await res.json();
        setData(timelineData);
      } catch (err: any) {
        console.error("Timeline fetch error:", err);
        setError(err.message || "Failed to load vehicle history.");
      } finally {
        setLoading(false);
      }
    }

    fetchTimeline();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="p-12 text-center text-zinc-500 space-y-3">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium">Querying Hyperledger Fabric & PostgreSQL lifecycle records...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto my-12 p-6 border rounded-xl bg-zinc-50 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
          <h2 className="text-lg font-bold text-zinc-900">Vehicle Not Found</h2>
          <p className="text-sm text-zinc-600">
            No vehicle ledger entry was found for identifier <code>{id}</code>.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => router.push("/vehicles/V-REAL-101")}>
              View Seed Vehicle (V-REAL-101)
            </Button>
            <Button onClick={() => router.push("/decision")}>
              Evaluate New Vehicle Claim
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const { vehicle, timeline, integrity_notice } = data;

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Ledger-Backed Lifecycle
              </Badge>
              <span className="text-xs text-zinc-400 font-mono">{vehicle.id}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
              <Car className="w-8 h-8 text-zinc-700" />
              {vehicle.registration_number}
            </h1>
            <p className="text-zinc-500 mt-1">
              {vehicle.manufacture_year} {vehicle.make} {vehicle.model} {vehicle.vin && `• VIN: ${vehicle.vin}`}
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push("/verification")}
              className="text-xs flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Verify Integrity</span>
            </Button>
            <Button 
              size="sm" 
              onClick={() => router.push(`/decision?vehicle_reg=${vehicle.registration_number}&vehicle_age=${new Date().getFullYear() - vehicle.manufacture_year}`)}
              className="bg-zinc-900 text-white text-xs hover:bg-zinc-800 flex items-center gap-1.5"
            >
              <span>New Claim Decision</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <User className="w-7 h-7 text-blue-600 bg-blue-50 p-1.5 rounded-lg shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-500 font-medium uppercase truncate">Registered Owner</p>
                <p className="font-semibold text-sm truncate">Rahul Sharma</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-indigo-600 bg-indigo-50 p-1.5 rounded-lg shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-500 font-medium uppercase truncate">Active Policy</p>
                <p className="font-semibold text-sm truncate">HDFC ERGO</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <Activity className="w-7 h-7 text-amber-600 bg-amber-50 p-1.5 rounded-lg shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-500 font-medium uppercase truncate">Recorded Claims</p>
                <p className="font-semibold text-sm truncate">
                  {timeline.filter(t => t.event_type === "CLAIM_FILED").length} Active
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <FileText className="w-7 h-7 text-zinc-600 bg-zinc-100 p-1.5 rounded-lg shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-500 font-medium uppercase truncate">Immutable Events</p>
                <p className="font-semibold text-sm truncate">{timeline.length} Anchored</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cryptographic Disclaimer Notice */}
        <div className="p-3 bg-zinc-100 border border-zinc-200 rounded-lg flex items-start gap-2.5 text-zinc-700 text-xs">
          <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {integrity_notice}
          </p>
        </div>

        {/* Chronological Timeline */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-zinc-900">Chronological Lifecycle Ledger</h2>
            <span className="text-xs text-zinc-500">{timeline.length} verified lifecycle checkpoints</span>
          </div>

          {timeline.length === 0 ? (
            <div className="p-8 border-2 border-dashed rounded-xl text-center text-zinc-400">
              No historical events recorded for this vehicle yet.
            </div>
          ) : (
            <div className="space-y-3">
              {timeline.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="hover:border-zinc-300 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-zinc-900">{item.title}</span>
                          <ProvenanceTypeBadge type={item.provenance_type} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <time className="font-mono">{item.date}</time>
                          {item.blockchain_verified && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] py-0">
                              <ShieldCheck className="w-3 h-3 mr-1" /> Fabric Committed
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-zinc-600 mt-1">{item.description}</p>

                      <div className="flex justify-between items-center mt-3 pt-2 border-t text-[11px] text-zinc-400">
                        <span>Authorized Recording Actor: <strong className="text-zinc-600">{item.actor}</strong></span>
                        <span className="font-mono text-[10px] uppercase tracking-wider">{item.event_type}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function ProvenanceTypeBadge({ type }: { type: string }) {
  if (type === "DATABASE_RECORD") {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] py-0">
        Database Record
      </Badge>
    );
  }
  if (type === "USER_PROVIDED_RECORD") {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] py-0">
        User-Provided Record
      </Badge>
    );
  }
  if (type === "COMPUTED_RECORD") {
    return (
      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] py-0">
        Computed Record
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-zinc-100 text-zinc-600 text-[10px] py-0">
      {type}
    </Badge>
  );
}

"use client";

import { AppShell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, ShieldCheck, Activity, User, FileText, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VehicleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [vehicle, setVehicle] = useState<any>(null);

  useEffect(() => {
    // In a real app, fetch from FastApi. Mocking for demo visual structure.
    setVehicle({
      id: id || "V-10293",
      registration: "MH-01-AB-1234",
      make: "Hyundai",
      model: "Creta",
      year: 2021,
      owner: "Rahul Sharma",
      insurer: "Insurer A",
      status: "ACTIVE",
      history: [
        { date: "2021-05-10", type: "PURCHASE", desc: "Vehicle registered to Rahul Sharma", org: "RTO", verified: true },
        { date: "2021-05-11", type: "POLICY ISSUED", desc: "Comprehensive Cover via Insurer A", org: "Insurer A", verified: true },
        { date: "2022-06-15", type: "SERVICE", desc: "10,000 km Scheduled Maintenance", org: "Quality Garage", verified: true },
        { date: "2023-08-20", type: "ACCIDENT", desc: "Front bumper damage reported", org: "Insurer A", verified: true },
        { date: "2023-08-21", type: "CLAIM FILED", desc: "Claim #CLM-9012 created", org: "Insurer A", verified: true },
        { date: "2023-08-25", type: "REPAIR", desc: "Bumper replaced, painted", org: "Quality Garage", verified: true },
        { date: "2023-08-28", type: "CLAIM SETTLED", desc: "Payout transferred to Garage", org: "Insurer A", verified: true },
      ]
    });
  }, [id]);

  if (!vehicle) return <AppShell><div className="p-8">Loading vehicle ledger...</div></AppShell>;

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Car className="w-8 h-8 text-zinc-400" />
              {vehicle.registration}
            </h1>
            <p className="text-zinc-500 mt-1">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
          </div>
          <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200 text-sm py-1">
            <ShieldCheck className="w-4 h-4 mr-1" /> Ledger Verified
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <User className="w-8 h-8 text-blue-500 bg-blue-50 p-1.5 rounded-md" />
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase">Current Owner</p>
                <p className="font-semibold">{vehicle.owner}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <ShieldCheck className="w-8 h-8 text-indigo-500 bg-indigo-50 p-1.5 rounded-md" />
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase">Active Policy</p>
                <p className="font-semibold">{vehicle.insurer}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <Activity className="w-8 h-8 text-amber-500 bg-amber-50 p-1.5 rounded-md" />
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase">Total Claims</p>
                <p className="font-semibold">1 Settled</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <FileText className="w-8 h-8 text-zinc-500 bg-zinc-100 p-1.5 rounded-md" />
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase">Ledger Events</p>
                <p className="font-semibold">{vehicle.history.length} Immutable</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-bold mt-8 mb-4">Lifecycle Timeline</h2>
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
          {vehicle.history.map((item: any, idx: number) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                {idx === vehicle.history.length -1 ? <ArrowRight className="w-4 h-4 text-blue-500" /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
              </div>
              <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <Badge variant="secondary" className="text-xs font-mono">{item.type}</Badge>
                    <time className="text-xs text-slate-500">{item.date}</time>
                  </div>
                  <p className="font-medium text-slate-900 mt-2">{item.desc}</p>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                    <span className="text-xs text-slate-500">Source: {item.org}</span>
                    {item.verified && <span className="flex items-center text-xs text-green-600 font-medium"><ShieldCheck className="w-3 h-3 mr-1" /> Ledger</span>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

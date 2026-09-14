import { AppShell } from "@/components/layout/Shell";
import { ShieldAlert, FileText, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Welcome to InsureTrace</h1>
          <p className="text-zinc-500 mt-1">Select an action to continue.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashboardCard 
            title="Start Claim Analysis" 
            description="Upload policy and estimate to evaluate a new claim."
            icon={<FileText className="w-6 h-6 text-blue-600" />}
            color="bg-blue-50 border-blue-100"
          />
          <DashboardCard 
            title="Verify Vehicle History" 
            description="Check the trusted blockchain ledger for a vehicle."
            icon={<CheckCircle2 className="w-6 h-6 text-green-600" />}
            color="bg-green-50 border-green-100"
          />
          <DashboardCard 
            title="Anomaly Monitoring" 
            description="Review flagged claims and suspicious patterns."
            icon={<ShieldAlert className="w-6 h-6 text-amber-600" />}
            color="bg-amber-50 border-amber-100"
          />
        </div>
      </div>
    </AppShell>
  );
}

function DashboardCard({ title, description, icon, color }: { title: string, description: string, icon: React.ReactNode, color: string }) {
  return (
    <div className={`p-6 rounded-xl border ${color} cursor-pointer hover:shadow-md transition-shadow`}>
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          {icon}
        </div>
        <h3 className="font-semibold text-zinc-900">{title}</h3>
      </div>
      <p className="text-sm text-zinc-600">{description}</p>
    </div>
  );
}

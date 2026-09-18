import React from "react";
import Link from "next/link";
import { Shield, Home, Car, FileText, Settings, Menu, BarChart3, UploadCloud } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-zinc-200">
        <div className="flex items-center h-16 px-6 border-b border-zinc-200">
          <Shield className="w-6 h-6 text-zinc-900 mr-2" />
          <span className="font-semibold text-lg tracking-tight text-zinc-900">InsureTrace</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem href="/decision" icon={<Home className="w-5 h-5" />} label="Decision Engine" />
          <NavItem href="/decision/extract" icon={<UploadCloud className="w-5 h-5" />} label="Document Review" />
          <NavItem href="/vehicles/V-REAL-101" icon={<Car className="w-5 h-5" />} label="Vehicle Timeline" />
          <NavItem href="/dashboards/insurer" icon={<Shield className="w-5 h-5" />} label="Insurer Portal" />
          <NavItem href="/dashboards/garage" icon={<FileText className="w-5 h-5" />} label="Garage Portal" />
          <NavItem href="/dashboards/surveyor" icon={<BarChart3 className="w-5 h-5" />} label="Surveyor Portal" />
          <NavItem href="/verification" icon={<Settings className="w-5 h-5" />} label="Ledger Verification" />
          <NavItem href="/decision/consent" icon={<Shield className="w-5 h-5" />} label="Consent Privacy" />
        </nav>
        <div className="p-4 border-t border-zinc-200">
          <NavItem href="/settings" icon={<Settings className="w-5 h-5" />} label="Settings" />
        </div>
      </aside>

      <div className="flex-1 flex flex-col w-full h-full">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-zinc-200">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-zinc-900 mr-2" />
            <span className="font-semibold text-lg tracking-tight text-zinc-900">InsureTrace</span>
          </div>
          <button className="p-2 -mr-2 text-zinc-600">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        {/* Mobile Bottom Navigation (Optional depending on precise flow) */}
        <nav className="md:hidden flex items-center justify-around h-16 bg-white border-t border-zinc-200 px-4">
          <Link href="/" className="flex flex-col items-center p-2 text-zinc-600">
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Home</span>
          </Link>
          <Link href="/vehicles" className="flex flex-col items-center p-2 text-zinc-600">
            <Car className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Vehicles</span>
          </Link>
          <Link href="/claims" className="flex flex-col items-center p-2 text-zinc-600">
            <FileText className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Claims</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link 
      href={href} 
      className="flex items-center px-3 py-2 text-zinc-600 rounded-md hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
    >
      {icon}
      <span className="ml-3 font-medium text-sm">{label}</span>
    </Link>
  );
}

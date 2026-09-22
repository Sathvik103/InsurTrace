'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Car, FileText, Scale, Settings, Truck, ShieldCheck, X, ArrowRight } from 'lucide-react';
import { useVehicle } from '@/context/VehicleContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { vehicles, setSelectedVehicleId } = useVehicle();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global keydown shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via event or parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Navigation Items
  const staticCommands = [
    { label: 'Check a Claim Decision', href: '/decision', icon: Scale, category: 'Actions' },
    { label: 'Add a New Vehicle', href: '/vehicles/new', icon: Car, category: 'Actions' },
    { label: 'Upload / Review Document', href: '/decision/extract', icon: FileText, category: 'Actions' },
    { label: 'Verify Record Integrity (Ledger)', href: '/verification', icon: ShieldCheck, category: 'Actions' },
    { label: 'Fleet Management', href: '/fleet', icon: Truck, category: 'Actions' },
    { label: 'Vehicle Reports & Export', href: '/reports', category: 'Actions', icon: FileText },
    { label: 'System Status & Health', href: '/settings?tab=status', category: 'System', icon: ShieldCheck },
    { label: 'Account & Privacy Settings', href: '/settings', category: 'Settings', icon: Settings },
  ];

  // Filtered vehicles
  const matchedVehicles = vehicles.filter(
    (v) =>
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.registration_number.toLowerCase().includes(q)
  );

  // Filtered commands
  const matchedCommands = staticCommands.filter((c) =>
    c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
  );

  const handleSelectVehicle = (vehId: string) => {
    setSelectedVehicleId(vehId);
    router.push(`/vehicles/${vehId}`);
    onClose();
  };

  const handleNavigate = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs z-50 flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vehicles, claims, documents, settings (Esc to close)..."
            className="w-full text-xs font-medium bg-transparent border-none outline-hidden text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-4 text-xs">
          {/* Vehicles Section */}
          {matchedVehicles.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2.5 py-1">
                Vehicles
              </div>
              <div className="space-y-0.5 mt-0.5">
                {matchedVehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectVehicle(v.id)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Car className="w-4 h-4 text-zinc-500" />
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {v.make} {v.model}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {v.registration_number} • {v.is_demo ? 'Demo Record' : 'My Vehicle'}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions & Navigation Section */}
          {matchedCommands.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2.5 py-1">
                Quick Actions
              </div>
              <div className="space-y-0.5 mt-0.5">
                {matchedCommands.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.href}
                      type="button"
                      onClick={() => handleNavigate(cmd.href)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-zinc-500" />
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {cmd.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400">{cmd.category}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {matchedVehicles.length === 0 && matchedCommands.length === 0 && (
            <div className="p-6 text-center text-zinc-500 text-xs">
              No matching records or actions found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

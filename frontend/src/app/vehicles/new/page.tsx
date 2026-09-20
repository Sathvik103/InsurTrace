'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/common/PageHeader';
import { FadeIn, SlideUp } from '@/components/motion/MotionPrimitives';
import { useVehicle, Vehicle } from '@/context/VehicleContext';
import { formatINR } from '@/lib/formatters';
import {
  Car,
  CheckCircle2,
  ArrowRight,
  Shield,
  FileText,
  Truck,
  Scale,
  Calendar,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

const COMMON_MAKES = [
  'Hyundai',
  'Tata',
  'Maruti Suzuki',
  'Mahindra',
  'Honda',
  'Toyota',
  'Kia',
  'Volkswagen',
  'Skoda',
  'MG',
  'Force Motors',
  'Ashok Leyland',
  'Other',
];

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];

const USAGE_TYPES = [
  {
    id: 'PERSONAL',
    label: 'Personal Vehicle',
    desc: 'Private passenger car or two-wheeler for personal use',
    icon: Car,
  },
  {
    id: 'TAXI',
    label: 'Taxi / Cab',
    desc: 'Ride-hailing, airport cab, or tourist taxi service',
    icon: Car,
  },
  {
    id: 'GOODS_CARRIER',
    label: 'Goods Carrier',
    desc: 'Mini-truck, delivery van, or commercial cargo vehicle',
    icon: Truck,
  },
  {
    id: 'PASSENGER_COMMERCIAL',
    label: 'Passenger Van / Mini-Bus',
    desc: 'Staff transport, school van, or commercial passenger carrier',
    icon: Truck,
  },
  {
    id: 'BUS',
    label: 'Bus / Heavy Coach',
    desc: 'Intercity or municipal heavy commercial bus',
    icon: Truck,
  },
];

export default function NewVehiclePage() {
  const router = useRouter();
  const { addVehicle, setSelectedVehicleId } = useVehicle();

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Core Basics (Required)
    registrationNumber: '',
    make: 'Hyundai',
    model: '',
    // Step 2: Specs (Optional)
    variant: '',
    manufactureYear: new Date().getFullYear().toString(),
    fuelType: 'Petrol',
    vin: '',
    // Step 3: Usage Type
    usageType: 'PERSONAL',
    permitInfo: '',
    fitnessValidUntil: '',
    downtimeCostPerDay: '',
    // Step 4: Policy (Optional)
    insurer: '',
    policyNumber: '',
    idv: '',
    ncbPercentage: '20',
    zeroDep: false,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdVehicle, setCreatedVehicle] = useState<Vehicle | null>(null);

  const isCommercial = formData.usageType !== 'PERSONAL';

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const cleanReg = formData.registrationNumber.trim().toUpperCase();
    if (!cleanReg) {
      setError('Please provide a vehicle registration number (e.g. MH02CB1234).');
      return;
    }
    if (!formData.make.trim()) {
      setError('Please select or specify the vehicle make.');
      return;
    }
    if (!formData.model.trim()) {
      setError('Please provide the vehicle model (e.g. Creta, Nexon, Dzire).');
      return;
    }

    setSaving(true);
    try {
      const newVehicle = await addVehicle({
        registration_number: cleanReg,
        make: formData.make.trim(),
        model: formData.model.trim(),
        variant: formData.variant.trim() || undefined,
        manufacture_year: parseInt(formData.manufactureYear) || new Date().getFullYear(),
        fuel_type: formData.fuelType,
        vin: formData.vin.trim() || undefined,
        usage_type: formData.usageType,
        permit_info: isCommercial && formData.permitInfo ? formData.permitInfo.trim() : undefined,
        fitness_valid_until:
          isCommercial && formData.fitnessValidUntil ? formData.fitnessValidUntil : undefined,
        downtime_cost_per_day:
          isCommercial && formData.downtimeCostPerDay
            ? parseFloat(formData.downtimeCostPerDay)
            : undefined,
        policy_number: formData.policyNumber.trim() || undefined,
        idv: formData.idv ? parseFloat(formData.idv) : undefined,
        ncb_percentage: formData.ncbPercentage ? parseInt(formData.ncbPercentage) : undefined,
        has_zero_dep: formData.zeroDep,
        policy_type: formData.zeroDep ? 'COMPREHENSIVE_ZERO_DEP' : 'COMPREHENSIVE',
      });

      setCreatedVehicle(newVehicle);
      setSelectedVehicleId(newVehicle.id);
    } catch (err: any) {
      console.error('Failed to create vehicle:', err);
      setError(err.message || 'Failed to save vehicle. Please check inputs.');
    } finally {
      setSaving(false);
    }
  };

  // SUCCESS SCREEN
  if (createdVehicle) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-8">
          <FadeIn>
            <div className="bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-6 sm:p-8 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <span className="text-[11px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                Registration Successful
              </span>
              <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-1">
                {createdVehicle.make} {createdVehicle.model} is Ready
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-2">
                Your vehicle has been registered to your profile. You can now calculate claim
                decisions, upload insurance policies, or inspect verified records.
              </p>

              {/* Summary Card */}
              <div className="mt-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-left">
                <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-700/60">
                  <div>
                    <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {createdVehicle.registration_number}
                    </span>
                    <span className="text-xs text-zinc-500 ml-2">
                      {createdVehicle.manufacture_year} • {createdVehicle.fuel_type}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                    {createdVehicle.usage_type?.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 text-xs">
                  <div>
                    <span className="text-zinc-400 text-[11px] block">Insured Declared Value</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {createdVehicle.idv ? formatINR(createdVehicle.idv) : 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[11px] block">No-Claim Bonus</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {createdVehicle.ncb_percentage !== undefined
                        ? `${createdVehicle.ncb_percentage}%`
                        : 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommended Next Actions */}
              <div className="mt-8 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 text-left">
                  What would you like to do next?
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Link
                    href={`/decision?vehicle_id=${createdVehicle.id}`}
                    className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-sky-500 dark:hover:border-sky-500 bg-white dark:bg-zinc-800/80 text-left transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <Scale className="w-5 h-5 text-sky-600 dark:text-sky-400 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Check Claim Decision
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Should you file a claim or pay for repairs yourself?
                      </p>
                    </div>
                    <div className="mt-3 text-[11px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                      <span>Calculate</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>

                  <Link
                    href={`/decision/extract?vehicle_reg=${encodeURIComponent(
                      createdVehicle.registration_number
                    )}`}
                    className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-sky-500 dark:hover:border-sky-500 bg-white dark:bg-zinc-800/80 text-left transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Upload Policy Document
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Extract policy terms and verify garage repair estimates.
                      </p>
                    </div>
                    <div className="mt-3 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <span>Upload & Review</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>

                  <Link
                    href={`/vehicles/${createdVehicle.id}`}
                    className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-sky-500 dark:hover:border-sky-500 bg-white dark:bg-zinc-800/80 text-left transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <Car className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        View Vehicle History
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Inspect chronological lifecycle events and verified ledger records.
                      </p>
                    </div>
                    <div className="mt-3 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span>Open History</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
                <Link
                  href="/vehicles"
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                >
                  ← Back to All Vehicles
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          title="Register a Vehicle"
          subtitle="Add your car, commercial vehicle, or fleet carrier to track policies, evaluate claims, and maintain verified history."
          breadcrumbs={[
            { label: 'Vehicles', href: '/vehicles' },
            { label: 'Register Vehicle' },
          ]}
        />

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Required Basics */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="w-6 h-6 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Vehicle Identification (Required)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Registration Number *
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. MH02CB1234"
                  required
                  className="w-full text-xs uppercase font-mono font-semibold px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[10px] text-zinc-400 mt-1">Indian RTO registration mark</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Make *
                </label>
                <select
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {COMMON_MAKES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Model *
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="e.g. Creta, Nexon, Swift"
                  required
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Usage Classification */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="w-6 h-6 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Usage Type & Commercial Status
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Select whether this is a personal passenger vehicle or a commercial carrier
                </p>
              </div>
            </div>

            {/* Usage Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {USAGE_TYPES.map((u) => {
                const isSelected = formData.usageType === u.id;
                const Icon = u.icon;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, usageType: u.id })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/60 dark:bg-sky-950/40 ring-2 ring-sky-500/20'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon
                        className={`w-4 h-4 ${
                          isSelected
                            ? 'text-sky-600 dark:text-sky-400'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      />
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {u.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 line-clamp-2">{u.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Commercial Context Fields (Conditional) */}
            {isCommercial && (
              <div className="mt-4 p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-200">
                  <Truck className="w-4 h-4" />
                  <span>Commercial & Fleet Parameters</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Permit Type / Number
                    </label>
                    <input
                      type="text"
                      name="permitInfo"
                      value={formData.permitInfo}
                      onChange={handleInputChange}
                      placeholder="e.g. All India Permit"
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Fitness Valid Until
                    </label>
                    <input
                      type="date"
                      name="fitnessValidUntil"
                      value={formData.fitnessValidUntil}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Daily Downtime Loss (₹/day)
                    </label>
                    <input
                      type="number"
                      name="downtimeCostPerDay"
                      value={formData.downtimeCostPerDay}
                      onChange={handleInputChange}
                      placeholder="e.g. 2500"
                      className="w-full text-xs font-mono px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <p className="text-[9px] text-zinc-500 mt-0.5">
                      Lost revenue each day this vehicle is in the repair workshop
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Specifications & Optional Details */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Specifications & Insurance (Optional / Can add later)
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400 font-medium">Optional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Variant / Trim
                </label>
                <input
                  type="text"
                  name="variant"
                  value={formData.variant}
                  onChange={handleInputChange}
                  placeholder="e.g. SX (O), Fearless"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Manufacture Year
                </label>
                <input
                  type="number"
                  name="manufactureYear"
                  value={formData.manufactureYear}
                  onChange={handleInputChange}
                  min="1990"
                  max="2030"
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Fuel Type
                </label>
                <select
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleInputChange}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {FUEL_TYPES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  VIN / Chassis (Optional)
                </label>
                <input
                  type="text"
                  name="vin"
                  value={formData.vin}
                  onChange={handleInputChange}
                  placeholder="17-character VIN"
                  className="w-full text-xs uppercase font-mono px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Policy inputs */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-3">
                Current Policy Details (For Claim & NCB calculations)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Insured Declared Value (IDV in ₹)
                  </label>
                  <input
                    type="number"
                    name="idv"
                    value={formData.idv}
                    onChange={handleInputChange}
                    placeholder="e.g. 650000"
                    className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Current NCB Percentage (%)
                  </label>
                  <select
                    name="ncbPercentage"
                    value={formData.ncbPercentage}
                    onChange={handleInputChange}
                    className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="0">0% (New vehicle or claimed last year)</option>
                    <option value="20">20% (1 claim-free year)</option>
                    <option value="25">25% (2 claim-free years)</option>
                    <option value="35">35% (3 claim-free years)</option>
                    <option value="45">45% (4 claim-free years)</option>
                    <option value="50">50% (5+ claim-free years)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="zeroDep"
                      checked={formData.zeroDep}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded text-sky-600 border-zinc-300 focus:ring-sky-500"
                    />
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Has Zero-Depreciation Add-on
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/vehicles"
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  <span>Registering Vehicle...</span>
                </>
              ) : (
                <>
                  <span>Register Vehicle</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

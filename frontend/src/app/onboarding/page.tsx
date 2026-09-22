'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { FadeIn, SlideUp } from '@/components/motion/MotionPrimitives';
import { VeriSureLogo } from '@/components/brand/VeriSureLogo';
import { TrustBadge } from '@/components/common/TrustBadge';
import { DataCompleteness } from '@/components/common/DataCompleteness';
import { useVehicle, Vehicle } from '@/context/VehicleContext';
import { formatINR } from '@/lib/formatters';
import {
  Scale,
  FileSearch,
  Car,
  Truck,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Info,
  HelpCircle,
  Clock,
  ChevronRight
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { addVehicle, setSelectedVehicleId } = useVehicle();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [createdVehicle, setCreatedVehicle] = useState<Vehicle | null>(null);

  // Step 1: Vehicle state
  const [vehicleData, setVehicleData] = useState({
    registrationNumber: '',
    unknownReg: false,
    make: 'Hyundai',
    model: 'Creta',
    variant: 'SX (O)',
    manufactureYear: 2022,
    fuelType: 'Petrol',
    usageType: 'PERSONAL',
  });

  // Step 2: Insurance state
  const [insuranceData, setInsuranceData] = useState({
    unknownPolicy: false,
    insurerName: 'HDFC ERGO',
    policyNumber: '',
    policyType: 'COMPREHENSIVE',
    policyExpiry: '2026-12-31',
    idv: 650000,
    ncbPercentage: 25,
    hasZeroDep: false,
  });

  // Step 3: Intent state
  const [intent, setIntent] = useState<string>('decision');

  // Step Navigation
  const handleNextStep = async () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Create vehicle and save to context
      const newVeh: Vehicle = {
        id: 'V-USER-' + Date.now().toString().slice(-4),
        registration_number: vehicleData.unknownReg
          ? `MH-01-PENDING-${Math.floor(1000 + Math.random() * 9000)}`
          : (vehicleData.registrationNumber.trim() || 'MH-02-CB-1234').toUpperCase(),
        make: vehicleData.make,
        model: vehicleData.model,
        variant: vehicleData.variant,
        manufacture_year: Number(vehicleData.manufactureYear),
        fuel_type: vehicleData.fuelType,
        usage_type: vehicleData.usageType,
        is_demo: false,
        policy_number: insuranceData.unknownPolicy ? undefined : (insuranceData.policyNumber || 'POL-PENDING'),
        idv: insuranceData.unknownPolicy ? 500000 : Number(insuranceData.idv),
        ncb_percentage: insuranceData.unknownPolicy ? 20 : Number(insuranceData.ncbPercentage),
        policy_type: insuranceData.policyType,
        policy_expiry: insuranceData.unknownPolicy ? undefined : insuranceData.policyExpiry,
        has_zero_dep: insuranceData.hasZeroDep,
        created_at: new Date().toISOString(),
      };

      try {
        await addVehicle(newVeh);
        setSelectedVehicleId(newVeh.id);
        setCreatedVehicle(newVeh);
      } catch (e) {
        console.error('Error saving vehicle:', e);
        setCreatedVehicle(newVeh);
      }

      setCurrentStep(4);
    }
  };

  const handleFinish = () => {
    if (intent === 'decision') {
      router.push(`/decision?vehicle_id=${createdVehicle?.id || ''}`);
    } else if (intent === 'extract') {
      router.push(`/decision/extract?vehicle_id=${createdVehicle?.id || ''}`);
    } else if (intent === 'fleet') {
      router.push('/fleet');
    } else {
      router.push(`/vehicles/${createdVehicle?.id || ''}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      <PublicNavbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <FadeIn>
            <div className="text-center max-w-xl mx-auto mb-8">
              <div className="flex justify-center mb-3">
                <VeriSureLogo size="lg" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Welcome to VeriSure
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                Set up your vehicle and insurance profile to get clear financial guidance.
              </p>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="flex items-center justify-between max-w-md mx-auto mb-8 px-2">
              {[
                { step: 1, label: 'Vehicle' },
                { step: 2, label: 'Insurance' },
                { step: 3, label: 'Your Goal' },
                { step: 4, label: 'Ready' },
              ].map((s, idx) => (
                <div key={s.step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        currentStep === s.step
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 ring-4 ring-zinc-200 dark:ring-zinc-800'
                          : currentStep > s.step
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {currentStep > s.step ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                    </div>
                    <span className="text-[10px] font-medium text-zinc-500 mt-1">{s.label}</span>
                  </div>
                  {idx < 3 && (
                    <div
                      className={`w-12 sm:w-16 h-0.5 mx-2 mb-3 transition-colors ${
                        currentStep > s.step ? 'bg-emerald-600' : 'bg-zinc-200 dark:bg-zinc-800'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </FadeIn>

          {/* STEP 1: Vehicle Information */}
          {currentStep === 1 && (
            <SlideUp distance={20} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  Step 1 of 4
                </span>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  Tell us about your vehicle
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  We use your vehicle age and category to calculate depreciation under Indian Motor Tariff GR.8.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Registration Number */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Vehicle Registration Number
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-700">
                      <input
                        type="checkbox"
                        checked={vehicleData.unknownReg}
                        onChange={(e) => setVehicleData({ ...vehicleData, unknownReg: e.target.checked })}
                        className="rounded accent-zinc-900"
                      />
                      <span>I don&apos;t know it yet</span>
                    </label>
                  </div>
                  {!vehicleData.unknownReg ? (
                    <input
                      type="text"
                      placeholder="e.g. MH-02-CB-1234 or DL-01-EV-4321"
                      value={vehicleData.registrationNumber}
                      onChange={(e) => setVehicleData({ ...vehicleData, registrationNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs font-mono uppercase rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  ) : (
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-500">
                      A temporary identifier will be assigned. You can update your registration later.
                    </div>
                  )}
                </div>

                {/* Make & Model */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Manufacturer / Make
                    </label>
                    <select
                      value={vehicleData.make}
                      onChange={(e) => setVehicleData({ ...vehicleData, make: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium"
                    >
                      <option value="Hyundai">Hyundai</option>
                      <option value="Tata">Tata Motors</option>
                      <option value="Maruti Suzuki">Maruti Suzuki</option>
                      <option value="Mahindra">Mahindra</option>
                      <option value="Honda">Honda</option>
                      <option value="Toyota">Toyota</option>
                      <option value="Kia">Kia</option>
                      <option value="Volkswagen">Volkswagen</option>
                      <option value="Other">Other Manufacturer</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Creta, Nexon EV, Swift"
                      value={vehicleData.model}
                      onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium"
                    />
                  </div>
                </div>

                {/* Year & Fuel */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Manufacture Year
                    </label>
                    <select
                      value={vehicleData.manufactureYear}
                      onChange={(e) => setVehicleData({ ...vehicleData, manufactureYear: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                    >
                      {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map((yr) => (
                        <option key={yr} value={yr}>
                          {yr} ({2026 - yr} yr old)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Fuel Type
                    </label>
                    <select
                      value={vehicleData.fuelType}
                      onChange={(e) => setVehicleData({ ...vehicleData, fuelType: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric (EV)</option>
                      <option value="CNG">CNG</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Usage Category
                    </label>
                    <select
                      value={vehicleData.usageType}
                      onChange={(e) => setVehicleData({ ...vehicleData, usageType: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="PERSONAL">Personal Car</option>
                      <option value="TAXI">Commercial Taxi</option>
                      <option value="GOODS_CARRIER">Goods Carrier</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <Link
                  href="/vehicles"
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                >
                  Skip to Demo Vehicles
                </Link>

                <button
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold shadow-xs"
                >
                  <span>Continue to Insurance</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </SlideUp>
          )}

          {/* STEP 2: Insurance Information */}
          {currentStep === 2 && (
            <SlideUp distance={20} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  Step 2 of 4
                </span>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  Your insurance policy schedule
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  We use your IDV and NCB to calculate your out-of-pocket costs and future premium impacts.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Skip toggle */}
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Don&apos;t have your policy handy?</p>
                    <p className="text-[11px] text-zinc-500">We will use standard industry estimates (₹6.5L IDV, 25% NCB).</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-sky-600 dark:text-sky-400">
                    <input
                      type="checkbox"
                      checked={insuranceData.unknownPolicy}
                      onChange={(e) => setInsuranceData({ ...insuranceData, unknownPolicy: e.target.checked })}
                      className="rounded accent-sky-600"
                    />
                    <span>Estimate for now</span>
                  </label>
                </div>

                {!insuranceData.unknownPolicy && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                          Insurance Company
                        </label>
                        <select
                          value={insuranceData.insurerName}
                          onChange={(e) => setInsuranceData({ ...insuranceData, insurerName: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                        >
                          <option value="HDFC ERGO">HDFC ERGO General Insurance</option>
                          <option value="ICICI Lombard">ICICI Lombard</option>
                          <option value="Bajaj Allianz">Bajaj Allianz General Insurance</option>
                          <option value="Tata AIG">Tata AIG General Insurance</option>
                          <option value="New India Assurance">The New India Assurance Co.</option>
                          <option value="Acko">Acko General Insurance</option>
                          <option value="Other">Other IRDAI-Registered Insurer</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                          Policy Type
                        </label>
                        <select
                          value={insuranceData.policyType}
                          onChange={(e) => setInsuranceData({ ...insuranceData, policyType: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                        >
                          <option value="COMPREHENSIVE">Comprehensive (Own Damage + Third Party)</option>
                          <option value="OWN_DAMAGE">Standalone Own Damage (OD)</option>
                          <option value="THIRD_PARTY">Third-Party Only</option>
                        </select>
                      </div>
                    </div>

                    {/* IDV & NCB with Explanations */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="font-bold text-zinc-800 dark:text-zinc-200">
                            Insured Declared Value (IDV)
                          </label>
                          <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            {formatINR(Number(insuranceData.idv))}
                          </span>
                        </div>
                        <input
                          type="number"
                          step="25000"
                          value={insuranceData.idv}
                          onChange={(e) => setInsuranceData({ ...insuranceData, idv: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                        />
                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                          The current insured valuation of your vehicle as written on page 1 of your policy schedule.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="font-bold text-zinc-800 dark:text-zinc-200">
                            Current No-Claim Bonus (NCB)
                          </label>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {insuranceData.ncbPercentage}%
                          </span>
                        </div>
                        <select
                          value={insuranceData.ncbPercentage}
                          onChange={(e) => setInsuranceData({ ...insuranceData, ncbPercentage: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                        >
                          <option value="0">0% (No discount / New car)</option>
                          <option value="20">20% (1 claim-free year)</option>
                          <option value="25">25% (2 claim-free years)</option>
                          <option value="35">35% (3 claim-free years)</option>
                          <option value="45">45% (4 claim-free years)</option>
                          <option value="50">50% (5+ claim-free years — Maximum)</option>
                        </select>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                          Your discount on Own Damage renewal premiums. Filing a claim resets this to 0%.
                        </p>
                      </div>
                    </div>

                    {/* Zero-Dep Checkbox */}
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <input
                        type="checkbox"
                        id="zeroDepCheck"
                        checked={insuranceData.hasZeroDep}
                        onChange={(e) => setInsuranceData({ ...insuranceData, hasZeroDep: e.target.checked })}
                        className="rounded accent-sky-600 w-4 h-4"
                      />
                      <label htmlFor="zeroDepCheck" className="text-xs cursor-pointer">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          I have a Zero-Depreciation (Nil Dep) Add-on Cover
                        </span>
                        <span className="block text-[10px] text-zinc-500 mt-0.5">
                          Insurers will waive depreciation on bumper, metal, and plastic parts during claims.
                        </span>
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold shadow-xs"
                >
                  <span>Continue to Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </SlideUp>
          )}

          {/* STEP 3: Intent / Goal Selection */}
          {currentStep === 3 && (
            <SlideUp distance={20} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  Step 3 of 4
                </span>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  What brings you to VeriSure today?
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Select your current priority so we can configure your personalized workspace.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    id: 'decision',
                    title: 'I have a scratch, dent, or repair and want to know if I should claim',
                    subtitle: 'Compare estimated insurance payout vs paying out-of-pocket and losing 3 years of NCB.',
                    icon: Scale,
                  },
                  {
                    id: 'extract',
                    title: 'I have a body shop repair estimate and want to check tariff admissibility',
                    subtitle: 'Upload your repair bill PDF to extract parts, depreciation, and deductible deductions.',
                    icon: FileSearch,
                  },
                  {
                    id: 'vehicle',
                    title: 'I want to track vehicle lifecycle, maintenance, and cryptographic records',
                    subtitle: 'Inspect tamper-evident provenance and export a VeriSure Data Passport.',
                    icon: Car,
                  },
                  {
                    id: 'fleet',
                    title: 'I manage commercial transport or fleet operations',
                    subtitle: 'Calculate business downtime losses, track fitness/permits, and manage fleet claims.',
                    icon: Truck,
                  },
                ].map((item) => {
                  const isSelected = intent === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setIntent(item.id)}
                      className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 ring-2 ring-sky-500/20'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-sky-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{item.title}</p>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 ml-2" />}
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">{item.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold shadow-xs"
                >
                  <span>Save Vehicle & View Readiness</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </SlideUp>
          )}

          {/* STEP 4: Readiness & Launch */}
          {currentStep === 4 && (
            <SlideUp distance={20} className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Setup Complete
                    </span>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {createdVehicle?.make} {createdVehicle?.model} is Ready
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Registration: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{createdVehicle?.registration_number}</strong>
                    </p>
                  </div>
                  <TrustBadge source="MY_VEHICLE" />
                </div>

                {/* Data Completeness Component */}
                <DataCompleteness vehicle={createdVehicle} showActionLink={false} />

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">Next Steps Available</p>
                  <p>You can upload a policy copy or body shop estimate at any time to verify document integrity on the consortium ledger.</p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Link
                    href={`/vehicles/${createdVehicle?.id}`}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 text-center transition-colors"
                  >
                    Open Vehicle Command Center
                  </Link>

                  <button
                    onClick={handleFinish}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold shadow-sm transition-all"
                  >
                    <span>Launch Decision Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </SlideUp>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

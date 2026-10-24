'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, describeApiError } from '@/lib/api';
import { toast } from 'sonner';

export interface Vehicle {
  id: string;
  registration_number: string;
  make: string;
  model: string;
  variant?: string;
  manufacture_year: number;
  fuel_type?: string;
  vin?: string;
  usage_type?: 'PERSONAL' | 'TAXI' | 'GOODS_CARRIER' | 'PASSENGER_COMMERCIAL' | 'BUS' | 'OTHER_COMMERCIAL' | string;
  permit_info?: string;
  fitness_valid_until?: string;
  downtime_cost_per_day?: number;
  is_demo?: boolean;
  policy_number?: string;
  idv?: number;
  ncb_percentage?: number;
  policy_type?: string;
  policy_expiry?: string;
  has_zero_dep?: boolean;
  /** True when the server could not be reached and the vehicle exists only in this browser. */
  is_local_only?: boolean;
  /** Own-damage renewal premium before NCB (₹). */
  od_premium?: number;
  created_at?: string;
}

export const FALLBACK_SEED_VEHICLES: Vehicle[] = [
  {
    id: 'V-REAL-101',
    registration_number: 'MH02CB1234',
    make: 'Hyundai',
    model: 'Creta',
    variant: 'SX (O)',
    manufacture_year: 2021,
    fuel_type: 'Petrol',
    vin: 'MALC341CBM0010192',
    usage_type: 'PERSONAL',
    is_demo: true,
    policy_number: '2311/2004/99812/00/000',
    idv: 650000,
    ncb_percentage: 25,
    policy_type: 'COMPREHENSIVE',
    policy_expiry: '2026-12-31',
    has_zero_dep: false,
    od_premium: 14200,
    created_at: '2021-05-10T10:00:00Z',
  },
  {
    id: 'V-REAL-102',
    registration_number: 'KA01MJ5678',
    make: 'Tata',
    model: 'Nexon EV',
    variant: 'Fearless+',
    manufacture_year: 2024,
    fuel_type: 'Electric',
    vin: 'MAT612015N0023411',
    usage_type: 'PERSONAL',
    is_demo: true,
    policy_number: '3104/5521/11029/01/000',
    idv: 1420000,
    ncb_percentage: 0,
    policy_type: 'COMPREHENSIVE_ZERO_DEP',
    policy_expiry: '2027-02-14',
    has_zero_dep: true,
    od_premium: 21500,
    created_at: '2024-02-14T09:30:00Z',
  },
  {
    id: 'V-REAL-103',
    registration_number: 'DL04AA9999',
    make: 'Maruti Suzuki',
    model: 'Swift',
    variant: 'ZXi+',
    manufacture_year: 2022,
    fuel_type: 'Petrol',
    vin: 'MA3EKB11SM0098231',
    usage_type: 'PERSONAL',
    is_demo: true,
    policy_number: '1809/4412/88219/00/000',
    idv: 480000,
    ncb_percentage: 35,
    policy_type: 'COMPREHENSIVE',
    policy_expiry: '2026-08-24',
    has_zero_dep: false,
    od_premium: 7800,
    created_at: '2022-08-20T11:15:00Z',
  },
  {
    id: 'V-REAL-104',
    registration_number: 'TS09EZ4321',
    make: 'Honda',
    model: 'City',
    variant: 'ZX e:HEV',
    manufacture_year: 2023,
    fuel_type: 'Hybrid',
    vin: 'MAKGM6680N0045129',
    usage_type: 'PERSONAL',
    is_demo: true,
    policy_number: '4210/9981/33410/00/000',
    idv: 950000,
    ncb_percentage: 50,
    policy_type: 'COMPREHENSIVE',
    policy_expiry: '2027-04-09',
    has_zero_dep: true,
    od_premium: 11400,
    created_at: '2023-04-05T14:45:00Z',
  },
  {
    id: 'V-COMM-201',
    registration_number: 'KA04C8821',
    make: 'Mahindra',
    model: 'Bolero Maxi Truck',
    variant: 'Plus CNG',
    manufacture_year: 2023,
    fuel_type: 'CNG / Diesel',
    vin: 'MA1XX8821N0091244',
    usage_type: 'GOODS_CARRIER',
    permit_info: 'All-India National Goods Permit',
    fitness_valid_until: '2027-04-30',
    downtime_cost_per_day: 3500,
    is_demo: true,
    policy_number: '5520/7710/44910/00/000',
    idv: 580000,
    ncb_percentage: 20,
    policy_type: 'COMMERCIAL_GOODS_PACKAGE',
    policy_expiry: '2027-06-14',
    has_zero_dep: false,
    created_at: '2023-06-12T08:00:00Z',
  },
  {
    id: 'V-COMM-202',
    registration_number: 'DL01T4501',
    make: 'Maruti Suzuki',
    model: 'Dzire Tour S',
    variant: 'Std Commercial',
    manufacture_year: 2024,
    fuel_type: 'CNG',
    vin: 'MA3TOUR4501P003299',
    usage_type: 'TAXI',
    permit_info: 'Delhi NCR Taxi Permit',
    fitness_valid_until: '2026-12-15',
    downtime_cost_per_day: 2200,
    is_demo: true,
    policy_number: '6612/8821/11920/00/000',
    idv: 620000,
    ncb_percentage: 0,
    policy_type: 'COMMERCIAL_PASSENGER_TAXI',
    policy_expiry: '2027-01-24',
    has_zero_dep: true,
    created_at: '2024-01-20T10:00:00Z',
  },
];

interface VehicleContextType {
  vehicles: Vehicle[];
  selectedVehicleId: string;
  selectedVehicle: Vehicle | null;
  setSelectedVehicleId: (id: string) => void;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<Vehicle>;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<Vehicle | null>;
  deleteVehicle: (id: string) => Promise<boolean>;
  refreshVehicles: () => Promise<void>;
  isLoading: boolean;
  isDemoActive: boolean;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

const STORAGE_KEY_SELECTED = 'verisure_active_vehicle_id';
const STORAGE_KEY_CUSTOM = 'verisure_custom_vehicles';

export function VehicleProvider({ children }: { children: React.ReactNode }) {
  const { token, status, isDemo } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>(FALLBACK_SEED_VEHICLES);
  const [selectedVehicleId, setSelectedVehicleIdState] = useState<string>('V-REAL-101');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Initial hydration from localStorage
  useEffect(() => {
    try {
      const savedSelected = localStorage.getItem(STORAGE_KEY_SELECTED);
      const savedCustom = localStorage.getItem(STORAGE_KEY_CUSTOM);
      
      // Start with vehicles saved on this device only; the server list replaces
      // them as soon as it arrives. Sample cars are never shown to real accounts.
      const initialVehicles: Vehicle[] = savedCustom ? (JSON.parse(savedCustom) as Vehicle[]).filter((v) => v.is_local_only) : [];
      // localStorage only exists after mount; reading it during render would break hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVehicles(initialVehicles);

      // Validate saved active vehicle exists
      if (savedSelected && initialVehicles.some((v) => v.id === savedSelected)) {
        setSelectedVehicleIdState(savedSelected);
      } else if (initialVehicles.length > 0) {
        setSelectedVehicleIdState(initialVehicles[0].id);
      }
    } catch (e) {
      console.warn('Failed to load vehicles from local storage', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Cross-tab synchronization for active vehicle
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_SELECTED && e.newValue) {
        setSelectedVehicleIdState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // 3. Sync with backend API (runs when auth token or status stabilizes)
  const refreshVehicles = useCallback(async () => {
    if (status === 'hydrating') return;

    try {
      {
        const backendVehicles = await apiFetch<Vehicle[]>('/api/v1/vehicles');
        if (Array.isArray(backendVehicles)) {
          setVehicles((prev) => {
            // The server is the source of truth. Demo cars keep their sample
            // policy details; cars saved only on this device are kept and flagged.
            const seed = new Map(FALLBACK_SEED_VEHICLES.map((v) => [v.id, v]));
            const map = new Map<string, Vehicle>();
            // Missing values arrive as null; drop them so they read as "not added"
            // and don't overwrite a demo car's sample policy details.
            const clean = (v: Vehicle) => Object.fromEntries(Object.entries(v).filter(([, x]) => x !== null)) as Vehicle;
            backendVehicles.map(clean).forEach((v) => map.set(v.id, v.is_demo ? { ...(seed.get(v.id) || {}), ...v } : v));
            prev.filter((v) => v.is_local_only && !map.has(v.id)).forEach((v) => map.set(v.id, v));
            const merged = Array.from(map.values());

            // Validate and retain active vehicle selection
            const savedSelected = localStorage.getItem(STORAGE_KEY_SELECTED);
            if (savedSelected && merged.some((v) => v.id === savedSelected)) {
              setSelectedVehicleIdState(savedSelected);
            } else if (!merged.some((v) => v.id === selectedVehicleId) && merged.length > 0) {
              setSelectedVehicleIdState(merged[0].id);
            }

            return merged;
          });
        }
      }
    } catch (err) {
      // Server unreachable: demo sessions can still explore with the sample cars.
      if (isDemo) setVehicles((prev) => (prev.some((v) => v.is_demo) ? prev : [...prev, ...FALLBACK_SEED_VEHICLES]));
      console.debug('Vehicle list unavailable:', err);
    }
  }, [token, status, selectedVehicleId, isDemo]);

  useEffect(() => {
    // Fetches from the API; state updates happen after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshVehicles();
  }, [refreshVehicles]);

  const setSelectedVehicleId = useCallback((id: string) => {
    setSelectedVehicleIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED, id);
    } catch (e) {
      console.warn('Failed to persist active vehicle ID', e);
    }
  }, []);

  const addVehicle = useCallback(async (newVehicleData: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
    const generatedId = `V-USER-${Date.now().toString().slice(-6)}`;
    const newVehicle: Vehicle = {
      ...newVehicleData,
      id: generatedId,
      created_at: new Date().toISOString(),
      is_demo: false,
    };

    // Try saving to the backend; fall back to this browser only (flagged) if unreachable.
    try {
      const saved = await apiFetch<Vehicle>('/api/v1/vehicles', {
        method: 'POST',
        body: {
          registration_number: newVehicle.registration_number,
          make: newVehicle.make,
          model: newVehicle.model,
          manufacture_year: newVehicle.manufacture_year,
          fuel_type: newVehicle.fuel_type || 'Petrol',
          variant: newVehicle.variant,
          usage_type: newVehicle.usage_type || 'PERSONAL',
          permit_info: newVehicle.permit_info,
          fitness_valid_until: newVehicle.fitness_valid_until,
          downtime_cost_per_day: newVehicle.downtime_cost_per_day,
          idv: newVehicle.idv,
          ncb_percentage: newVehicle.ncb_percentage,
          has_zero_dep: newVehicle.has_zero_dep,
          policy_number: newVehicle.policy_number,
          policy_expiry: newVehicle.policy_expiry,
          od_premium: newVehicle.od_premium,
          is_demo: false,
        },
      });
      if (saved?.id) newVehicle.id = saved.id;
    } catch (e) {
      const { title, message } = describeApiError(e);
      if ((e as { kind?: string })?.kind === 'validation') {
        // e.g. duplicate registration: surface it rather than silently keeping a local copy.
        toast.error(title, { description: message });
        throw e;
      }
      newVehicle.is_local_only = true;
      toast.warning('Saved in this browser only', {
        description: `${title}. The vehicle will not be available on other devices until the server is reachable.`,
      });
    }

    // Save locally
    setVehicles((prev) => {
      const updated = [newVehicle, ...prev];
      try {
        const customVehicles = updated.filter((v) => !v.is_demo);
        localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(customVehicles));
      } catch (err) {
        console.warn('Failed to persist custom vehicle', err);
      }
      return updated;
    });

    setSelectedVehicleId(newVehicle.id);
    return newVehicle;
  }, [setSelectedVehicleId]);

  const updateVehicle = useCallback(
    async (id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> => {
      let updatedVeh: Vehicle | null = null;
      setVehicles((prev) => {
        const updated = prev.map((v) => {
          if (v.id === id) {
            updatedVeh = { ...v, ...updates };
            return updatedVeh;
          }
          return v;
        });

        try {
          const customVehicles = updated.filter((v) => !v.is_demo);
          localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(customVehicles));
        } catch (e) {
          console.warn('Failed to persist updated vehicles', e);
        }

        return updated;
      });
      return updatedVeh;
    },
    []
  );

  const deleteVehicle = useCallback(
    async (id: string): Promise<boolean> => {
      const target = vehicles.find((v) => v.id === id);
      if (!target || target.is_demo) {
        // Do not delete demo templates
        return false;
      }

      setVehicles((prev) => {
        const filtered = prev.filter((v) => v.id !== id);
        try {
          const customVehicles = filtered.filter((v) => !v.is_demo);
          localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(customVehicles));
        } catch (e) {
          console.warn('Failed to update storage on vehicle deletion', e);
        }
        return filtered;
      });

      if (selectedVehicleId === id) {
        const remaining = vehicles.filter((v) => v.id !== id);
        if (remaining.length > 0) {
          setSelectedVehicleId(remaining[0].id);
        }
      }

      return true;
    },
    [vehicles, selectedVehicleId, setSelectedVehicleId]
  );

  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0] || null;
  }, [vehicles, selectedVehicleId]);

  const isDemoActive = Boolean(selectedVehicle?.is_demo);

  const value = useMemo(
    () => ({
      vehicles,
      selectedVehicleId,
      selectedVehicle,
      setSelectedVehicleId,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      refreshVehicles,
      isLoading,
      isDemoActive,
    }),
    [
      vehicles,
      selectedVehicleId,
      selectedVehicle,
      setSelectedVehicleId,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      refreshVehicles,
      isLoading,
      isDemoActive,
    ]
  );

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
}

export function useVehicle(): VehicleContextType {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicle must be used within a VehicleProvider');
  }
  return context;
}

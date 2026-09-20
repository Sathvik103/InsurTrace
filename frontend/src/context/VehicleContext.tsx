'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getAuthToken } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/lib/api';

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
  refreshVehicles: () => Promise<void>;
  isLoading: boolean;
  isDemoActive: boolean;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

const STORAGE_KEY_SELECTED = 'verisure_active_vehicle_id';
const STORAGE_KEY_CUSTOM = 'verisure_custom_vehicles';

export function VehicleProvider({ children }: { children: React.ReactNode }) {
  const { token, status } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>(FALLBACK_SEED_VEHICLES);
  const [selectedVehicleId, setSelectedVehicleIdState] = useState<string>('V-REAL-101');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Initial hydration from localStorage
  useEffect(() => {
    try {
      const savedSelected = localStorage.getItem(STORAGE_KEY_SELECTED);
      const savedCustom = localStorage.getItem(STORAGE_KEY_CUSTOM);
      
      let initialVehicles = [...FALLBACK_SEED_VEHICLES];
      if (savedCustom) {
        const parsedCustom: Vehicle[] = JSON.parse(savedCustom);
        const customIds = new Set(parsedCustom.map((v) => v.id));
        initialVehicles = [
          ...parsedCustom,
          ...FALLBACK_SEED_VEHICLES.filter((v) => !customIds.has(v.id)),
        ];
      }
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
      const currentToken = token || getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/vehicles`, { headers });
      if (res.ok) {
        const backendVehicles: Vehicle[] = await res.json();
        if (Array.isArray(backendVehicles) && backendVehicles.length > 0) {
          setVehicles((prev) => {
            const map = new Map<string, Vehicle>();
            FALLBACK_SEED_VEHICLES.forEach((v) => map.set(v.id, v));
            backendVehicles.forEach((v) => {
              const existing = map.get(v.id) || {};
              map.set(v.id, { ...existing, ...v });
            });
            prev.filter((v) => !v.is_demo).forEach((v) => map.set(v.id, v));
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
      console.debug('Using cached/fallback vehicles:', err);
    }
  }, [token, status, selectedVehicleId]);

  useEffect(() => {
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

    // Try posting to backend
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE_URL}/api/v1/vehicles`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
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
          is_demo: false,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        if (saved && saved.id) {
          newVehicle.id = saved.id;
        }
      }
    } catch (e) {
      console.warn('Backend unavailable, saving vehicle locally:', e);
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

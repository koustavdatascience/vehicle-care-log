import AsyncStorage from "@react-native-async-storage/async-storage";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useLocalDatabase } from "@/components/foundation/local-storage-provider";
import type { Vehicle, VehicleDraft, VehicleId } from "@/src/domain/models";
import { LocalVehicleRepository } from "@/src/repositories/local-repositories";

const ACTIVE_VEHICLE_STORAGE_KEY = "vehicle-care-log:active-vehicle-id";

type VehicleContextValue = {
  activeVehicle: Vehicle | null;
  activeVehicleId: VehicleId | null;
  error: string | null;
  isLoading: boolean;
  vehicles: readonly Vehicle[];
  archiveVehicle: (id: VehicleId) => Promise<void>;
  createVehicle: (draft: VehicleDraft) => Promise<Vehicle>;
  refreshVehicles: () => Promise<void>;
  selectVehicle: (id: VehicleId | null) => Promise<void>;
  updateVehicle: (draft: VehicleDraft) => Promise<Vehicle>;
};

const VehicleContext = createContext<VehicleContextValue | null>(null);

export function VehicleProvider({ children }: { children: ReactNode }) {
  const database = useLocalDatabase();
  const repository = useMemo(() => new LocalVehicleRepository(database), [database]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeVehicleId, setActiveVehicleId] = useState<VehicleId | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const persistSelection = useCallback(async (id: VehicleId | null) => {
    if (id === null) await AsyncStorage.removeItem(ACTIVE_VEHICLE_STORAGE_KEY);
    else await AsyncStorage.setItem(ACTIVE_VEHICLE_STORAGE_KEY, id);
  }, []);

  const refreshVehicles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [savedActiveId, activeVehicles] = await Promise.all([
        AsyncStorage.getItem(ACTIVE_VEHICLE_STORAGE_KEY),
        repository.listActive(),
      ]);
      const resolvedId = activeVehicles.some((vehicle) => vehicle.id === savedActiveId)
        ? savedActiveId
        : activeVehicles[0]?.id ?? null;
      setVehicles(activeVehicles);
      setActiveVehicleId(resolvedId);
      if (resolvedId !== savedActiveId) await persistSelection(resolvedId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Vehicles could not be loaded from local storage.");
    } finally {
      setIsLoading(false);
    }
  }, [persistSelection, repository]);

  useEffect(() => {
    void refreshVehicles();
  }, [refreshVehicles]);

  const selectVehicle = useCallback(async (id: VehicleId | null) => {
    const validSelection = id !== null && vehicles.some((vehicle) => vehicle.id === id) ? id : null;
    setActiveVehicleId(validSelection);
    try {
      await persistSelection(validSelection);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The active vehicle could not be remembered on this device.");
    }
  }, [persistSelection, vehicles]);

  const createVehicle = useCallback(async (draft: VehicleDraft) => {
    const saved = await repository.create(draft);
    const activeVehicles = await repository.listActive();
    setVehicles(activeVehicles);
    if (activeVehicleId === null) await selectVehicle(saved.id);
    return saved;
  }, [activeVehicleId, repository, selectVehicle]);

  const updateVehicle = useCallback(async (draft: VehicleDraft) => {
    const saved = await repository.update(draft);
    setVehicles((current) => current.map((vehicle) => vehicle.id === saved.id ? saved : vehicle));
    return saved;
  }, [repository]);

  const archiveVehicle = useCallback(async (id: VehicleId) => {
    await repository.archive(id);
    const activeVehicles = await repository.listActive();
    setVehicles(activeVehicles);
    if (id === activeVehicleId) await selectVehicle(activeVehicles[0]?.id ?? null);
  }, [activeVehicleId, repository, selectVehicle]);

  const value = useMemo<VehicleContextValue>(() => ({
    activeVehicle: vehicles.find((vehicle) => vehicle.id === activeVehicleId) ?? null,
    activeVehicleId,
    archiveVehicle,
    createVehicle,
    error,
    isLoading,
    refreshVehicles,
    selectVehicle,
    updateVehicle,
    vehicles,
  }), [activeVehicleId, archiveVehicle, createVehicle, error, isLoading, refreshVehicles, selectVehicle, updateVehicle, vehicles]);

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
}

export function useActiveVehicle(): VehicleContextValue {
  const context = useContext(VehicleContext);
  if (!context) throw new Error("useActiveVehicle must be used within VehicleProvider.");
  return context;
}

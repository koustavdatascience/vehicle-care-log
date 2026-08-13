import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

import { useThemeContext } from "@/lib/theme-provider";

export type ThemePreference = "system" | "light" | "dark";
export interface AppPreferences {
  currency: "INR";
  distanceUnit: "km";
  fuelUnit: "litre";
  notificationEnabled: boolean;
  notificationLeadDays: number;
  themePreference: ThemePreference;
}

const PREFERENCES_KEY = "vehicle-care-log:preferences";
const defaults: AppPreferences = { currency: "INR", distanceUnit: "km", fuelUnit: "litre", notificationEnabled: true, notificationLeadDays: 7, themePreference: "system" };

type PreferencesContextValue = {
  preferences: AppPreferences;
  isLoading: boolean;
  error: string | null;
  updatePreferences: (patch: Partial<AppPreferences>) => Promise<void>;
  reload: () => Promise<void>;
};
const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? "light";
  const { setColorScheme } = useThemeContext();
  const [preferences, setPreferences] = useState<AppPreferences>(defaults);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const applyTheme = useCallback((value: AppPreferences) => setColorScheme(value.themePreference === "system" ? systemScheme : value.themePreference), [setColorScheme, systemScheme]);
  const reload = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const saved = await AsyncStorage.getItem(PREFERENCES_KEY);
      const parsed = saved ? JSON.parse(saved) as Partial<AppPreferences> : {};
      const next = { ...defaults, ...parsed };
      setPreferences(next); applyTheme(next);
    } catch { setError("Preferences could not be restored. Default settings are in use."); setPreferences(defaults); applyTheme(defaults); } finally { setIsLoading(false); }
  }, [applyTheme]);
  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => { applyTheme(preferences); }, [applyTheme, preferences]);
  const updatePreferences = useCallback(async (patch: Partial<AppPreferences>) => {
    const next = { ...preferences, ...patch };
    setPreferences(next); applyTheme(next);
    try { await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(next)); setError(null); }
    catch { setError("Preference changes could not be saved. Please try again."); throw new Error("Preference changes could not be saved."); }
  }, [applyTheme, preferences]);
  const value = useMemo(() => ({ preferences, isLoading, error, updatePreferences, reload }), [preferences, isLoading, error, updatePreferences, reload]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used within PreferencesProvider.");
  return value;
}

import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import type { SqlDatabase } from "../../src/data/database-contract";
import { getVehicleCareDatabase, resetDatabaseForTests } from "../../src/data/vehicle-care-database";

type StorageState =
  | { status: "initializing"; database: null; message: null }
  | { status: "ready"; database: SqlDatabase; message: null }
  | { status: "unavailable"; database: null; message: string };

const LocalDatabaseContext = createContext<SqlDatabase | null>(null);

export function LocalStorageProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StorageState>({ status: "initializing", database: null, message: null });

  const initialize = useCallback(async () => {
    setState({ status: "initializing", database: null, message: null });
    try {
      const database = await getVehicleCareDatabase();
      setState({ status: "ready", database, message: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Local storage is unavailable. Your changes were not saved.";
      setState({ status: "unavailable", database: null, message });
    }
  }, []);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (state.status === "initializing") {
    return <StorageStatus title="Preparing your care log" detail="Setting up secure local storage on this device." loading />;
  }

  if (state.status === "unavailable") {
    return (
      <StorageStatus
        title="Local storage is unavailable"
        detail={state.message}
        actionLabel="Try again"
        onAction={() => {
          resetDatabaseForTests();
          void initialize();
        }}
      />
    );
  }

  return <LocalDatabaseContext.Provider value={state.database}>{children}</LocalDatabaseContext.Provider>;
}

export function useLocalDatabase(): SqlDatabase {
  const database = useContext(LocalDatabaseContext);
  if (!database) throw new Error("useLocalDatabase must be used after local storage has initialized.");
  return database;
}

function StorageStatus({ title, detail, loading = false, actionLabel, onAction }: { title: string; detail: string; loading?: boolean; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      {loading ? <ActivityIndicator size="small" color="#1E6FD9" /> : null}
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <Text style={styles.detail}>{detail}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", backgroundColor: "#F6F8FB", flex: 1, gap: 12, justifyContent: "center", padding: 28 },
  title: { color: "#102A43", fontSize: 22, fontWeight: "700", lineHeight: 28, textAlign: "center" },
  detail: { color: "#5C6B7A", fontSize: 16, lineHeight: 22, maxWidth: 320, textAlign: "center" },
  button: { backgroundColor: "#1E6FD9", borderRadius: 12, marginTop: 8, minHeight: 44, paddingHorizontal: 18, paddingVertical: 12 },
  buttonPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});

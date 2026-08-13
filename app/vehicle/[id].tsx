import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenContainer } from "@/components/screen-container";
import { EmptyState } from "@/components/ui/vcl-feedback";
import { layoutTokens } from "@/constants/design-tokens";

export default function VehicleDetailScreen() { const router = useRouter(); return <ScreenContainer><View style={styles.content}><AppHeader title="Vehicle" subtitle="Vehicle detail" onBack={() => router.back()} /><View style={styles.fill}><EmptyState title="Vehicle details are on the way" message="This route is ready for vehicle profiles in Phase 5. No example vehicle data is shown." /></View></View></ScreenContainer>; }
const styles = StyleSheet.create({ content: { flex: 1, padding: layoutTokens.spacing.md, gap: layoutTokens.spacing.lg }, fill: { flex: 1, justifyContent: "center" } });

import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenContainer } from "@/components/screen-container";
import { ConfirmationSurface, InlineError } from "@/components/ui/vcl-feedback";
import { VclButton } from "@/components/ui/vcl-button";
import { VclCard } from "@/components/ui/vcl-card";
import { layoutTokens } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";

export default function AddRecordScreen() { const router = useRouter(); const colors = useColors(); return <ScreenContainer edges={["top", "bottom", "left", "right"]}><ScrollView contentContainerStyle={styles.content}><AppHeader title="Add a record" subtitle="Choose what you would like to log" onBack={() => router.back()} /><VclCard><Text style={[styles.title, { color: colors.foreground }]}>A vehicle is required first</Text><Text style={[styles.message, { color: colors.muted }]}>Vehicle profiles and record forms are introduced in Phase 5. This modal confirms the navigation flow without creating incomplete data.</Text></VclCard><View style={styles.options}><VclButton label="Fuel fill" icon="creditcard.fill" disabled /><VclButton label="Service" icon="wrench.and.screwdriver.fill" disabled /><VclButton label="Repair" icon="car.fill" disabled /><VclButton label="Reminder" icon="bell.fill" disabled /></View><InlineError message="Add a vehicle before creating a vehicle-care record. No data has been lost." /><ConfirmationSurface title="Leave this flow?" message="Closing returns you to the dashboard without changing your local data."><VclButton label="Close" variant="secondary" onPress={() => router.back()} icon="xmark" /></ConfirmationSurface></ScrollView></ScreenContainer>; }
const styles = StyleSheet.create({ content: { padding: layoutTokens.spacing.md, gap: layoutTokens.spacing.lg }, title: { fontSize: 18, fontWeight: "800" }, message: { marginTop: 6, fontSize: 14, lineHeight: 20 }, options: { gap: layoutTokens.spacing.sm } });

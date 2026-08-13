import { ScrollView, StyleSheet, View } from "react-native";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenContainer } from "@/components/screen-container";
import { EmptyState, StatusBanner } from "@/components/ui/vcl-feedback";
import { layoutTokens } from "@/constants/design-tokens";

export function PhasePlaceholderScreen({ title, message, icon }: { title: string; message: string; icon: "wrench.and.screwdriver.fill" | "chart.pie.fill" | "gearshape.fill" }) { return <ScreenContainer><ScrollView contentContainerStyle={styles.content}><AppHeader title={title} subtitle="Vehicle Care Log" /><StatusBanner title="Local-first pilot" message="Your data stays on this device while the feature is being prepared." /><View style={styles.fill}><EmptyState icon={icon} title={`${title} is next`} message={message} /></View></ScrollView></ScreenContainer>; }
const styles = StyleSheet.create({ content: { flexGrow: 1, padding: layoutTokens.spacing.md, gap: layoutTokens.spacing.lg }, fill: { flex: 1, justifyContent: "center" } });

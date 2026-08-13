import type { ReactNode } from "react";
import { Component } from "react";
import { StyleSheet, Text, View } from "react-native";

import { VclButton } from "@/components/ui/vcl-button";
import { layoutTokens } from "@/constants/design-tokens";
import { safeDiagnosticError } from "@/src/diagnostics/safe-diagnostics";

type AppErrorBoundaryProps = Readonly<{ children: ReactNode }>;
type AppErrorBoundaryState = Readonly<{ hasError: boolean }>;

/** Contains rendering failures without exposing record data or exception text to users. */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public state: AppErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error): void {
    safeDiagnosticError("ui.render_failure", error);
  }

  private retry = (): void => {
    this.setState({ hasError: false });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View accessible accessibilityRole="alert" style={styles.container}>
          <Text style={styles.title}>We could not open this screen</Text>
          <Text style={styles.body}>Your locally saved vehicle records remain unchanged. Please try again.</Text>
          <VclButton label="Try again" onPress={this.retry} accessibilityHint="Attempts to reload the screen" />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", gap: layoutTokens.spacing.md, padding: layoutTokens.spacing.lg },
  title: { color: "#111827", fontSize: 22, fontWeight: "800", lineHeight: 28 },
  body: { color: "#475569", fontSize: 16, lineHeight: 24 },
});

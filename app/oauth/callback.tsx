import { ThemedView } from "@/components/themed-view";
import { safeDiagnostic, safeDiagnosticError } from "@/src/diagnostics/safe-diagnostics";
import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AUTH_RECOVERY_MESSAGE = "We could not complete sign-in. Please return to Settings and try again.";

export default function OAuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string;
    state?: string;
    error?: string;
    sessionToken?: string;
    user?: string;
  }>();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const finishSuccessfully = () => {
      if (!isMounted) return;
      setStatus("success");
      setTimeout(() => router.replace("/(tabs)"), 1000);
    };

    const failSafely = (event: string, error?: unknown) => {
      if (error) {
        safeDiagnosticError(event, error);
      } else {
        safeDiagnostic(event);
      }
      if (!isMounted) return;
      setStatus("error");
      setErrorMessage(AUTH_RECOVERY_MESSAGE);
    };

    const storeUserInfo = async (encodedUser: string) => {
      try {
        const userJson = typeof atob !== "undefined" ? atob(encodedUser) : Buffer.from(encodedUser, "base64").toString("utf-8");
        const userData = JSON.parse(userJson);
        const userInfo: Auth.User = {
          id: userData.id,
          openId: userData.openId,
          name: userData.name,
          email: userData.email,
          loginMethod: userData.loginMethod,
          lastSignedIn: new Date(userData.lastSignedIn || Date.now()),
        };
        await Auth.setUserInfo(userInfo);
      } catch (error) {
        safeDiagnosticError("oauth.callback_user_decode_failed", error);
      }
    };

    const handleCallback = async () => {
      safeDiagnostic("oauth.callback_started", {
        hasCode: Boolean(params.code),
        hasState: Boolean(params.state),
        hasError: Boolean(params.error),
        hasSessionToken: Boolean(params.sessionToken),
        hasUser: Boolean(params.user),
      });

      try {
        if (params.sessionToken) {
          await Auth.setSessionToken(params.sessionToken);
          if (params.user) await storeUserInfo(params.user);
          safeDiagnostic("oauth.callback_succeeded", { method: "route_session_token" });
          finishSuccessfully();
          return;
        }

        let url: string | null = null;
        if (params.code || params.state || params.error) {
          const urlParams = new URLSearchParams();
          if (params.code) urlParams.set("code", params.code);
          if (params.state) urlParams.set("state", params.state);
          if (params.error) urlParams.set("error", params.error);
          url = `?${urlParams.toString()}`;
        } else {
          url = await Linking.getInitialURL();
        }

        const providerError = params.error || (url ? new URL(url, "http://placeholder.invalid").searchParams.get("error") : null);
        if (providerError) {
          failSafely("oauth.callback_denied");
          return;
        }

        const parsedUrl = url ? new URL(url, "http://placeholder.invalid") : null;
        const code = params.code ?? parsedUrl?.searchParams.get("code") ?? null;
        const state = params.state ?? parsedUrl?.searchParams.get("state") ?? null;
        const sessionToken = parsedUrl?.searchParams.get("sessionToken") ?? null;

        if (sessionToken) {
          await Auth.setSessionToken(sessionToken);
          safeDiagnostic("oauth.callback_succeeded", { method: "url_session_token" });
          finishSuccessfully();
          return;
        }

        if (!code || !state) {
          failSafely("oauth.callback_missing_credentials");
          return;
        }

        const result = await Api.exchangeOAuthCode(code, state);
        if (!result.sessionToken) {
          failSafely("oauth.callback_missing_session");
          return;
        }

        await Auth.setSessionToken(result.sessionToken);
        if (result.user) {
          const userInfo: Auth.User = {
            id: result.user.id,
            openId: result.user.openId,
            name: result.user.name,
            email: result.user.email,
            loginMethod: result.user.loginMethod,
            lastSignedIn: new Date(result.user.lastSignedIn || Date.now()),
          };
          await Auth.setUserInfo(userInfo);
        }
        safeDiagnostic("oauth.callback_succeeded", { method: "code_exchange" });
        finishSuccessfully();
      } catch (error) {
        failSafely("oauth.callback_failed", error);
      }
    };

    void handleCallback();
    return () => {
      isMounted = false;
    };
  }, [params.code, params.error, params.sessionToken, params.state, params.user, router]);

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom", "left", "right"]}>
      <ThemedView className="flex-1 items-center justify-center gap-4 p-5">
        {status === "processing" && (
          <>
            <ActivityIndicator size="large" />
            <Text className="mt-4 text-center text-base leading-6 text-foreground">Completing authentication...</Text>
          </>
        )}
        {status === "success" && (
          <>
            <Text className="text-center text-base leading-6 text-foreground">Authentication successful.</Text>
            <Text className="text-center text-base leading-6 text-foreground">Redirecting...</Text>
          </>
        )}
        {status === "error" && (
          <>
            <Text className="mb-2 text-xl font-bold leading-7 text-error">Authentication failed</Text>
            <Text accessibilityRole="alert" className="text-center text-base leading-6 text-foreground">
              {errorMessage}
            </Text>
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

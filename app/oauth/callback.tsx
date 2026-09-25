import { ThemedView } from "@/components/themed-view";
import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function userFromOAuth(data: any): Auth.User {
  return {
    id: data.id,
    openId: data.openId ?? null,
    name: data.name ?? null,
    email: data.email ?? null,
    loginMethod: data.loginMethod ?? null,
    authProvider: "manus",
    lastSignedIn: new Date(data.lastSignedIn || Date.now()),
  };
}

function decodeUser(encoded: string) {
  const raw = typeof atob !== "undefined"
    ? atob(encoded)
    : Buffer.from(encoded, "base64").toString("utf-8");
  return JSON.parse(raw);
}

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
    let active = true;
    const handleCallback = async () => {
      try {
        if (params.sessionToken) {
          await Auth.setSessionToken(params.sessionToken);
          if (params.user) {
            try {
              await Auth.setUserInfo(userFromOAuth(decodeUser(params.user)));
            } catch {
              // OAuth remains authenticated; the profile can be fetched from the server.
            }
          }
          if (active) setStatus("success");
          setTimeout(() => router.replace("/(tabs)"), 800);
          return;
        }

        let url: string | null = null;
        if (params.code || params.state || params.error) {
          const search = new URLSearchParams();
          if (params.code) search.set("code", params.code);
          if (params.state) search.set("state", params.state);
          if (params.error) search.set("error", params.error);
          url = `?${search.toString()}`;
        } else {
          url = await Linking.getInitialURL();
        }

        const urlParams = url ? new URL(url, "http://localhost").searchParams : null;
        const authError = params.error || urlParams?.get("error");
        if (authError) throw new Error(authError);

        const code = params.code || urlParams?.get("code");
        const state = params.state || urlParams?.get("state");
        const tokenFromUrl = urlParams?.get("sessionToken");
        if (tokenFromUrl) {
          await Auth.setSessionToken(tokenFromUrl);
          if (active) setStatus("success");
          setTimeout(() => router.replace("/(tabs)"), 800);
          return;
        }
        if (!code || !state) throw new Error("Missing code or state parameter");

        const result = await Api.exchangeOAuthCode(code, state);
        if (!result.sessionToken) throw new Error("No session token received");
        await Auth.setSessionToken(result.sessionToken);
        if (result.user) await Auth.setUserInfo(userFromOAuth(result.user));
        if (active) setStatus("success");
        setTimeout(() => router.replace("/(tabs)"), 800);
      } catch (error) {
        if (!active) return;
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Failed to complete authentication");
      }
    };

    void handleCallback();
    return () => { active = false; };
  }, [params.code, params.state, params.error, params.sessionToken, params.user, router]);

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom", "left", "right"]}>
      <ThemedView className="flex-1 items-center justify-center gap-4 p-5">
        {status === "processing" && (
          <>
            <ActivityIndicator size="large" />
            <Text className="mt-4 text-base leading-6 text-center text-foreground">Completing authentication...</Text>
          </>
        )}
        {status === "success" && (
          <>
            <Text className="text-base leading-6 text-center text-foreground">Authentication successful!</Text>
            <Text className="text-base leading-6 text-center text-foreground">Redirecting...</Text>
          </>
        )}
        {status === "error" && (
          <>
            <Text className="mb-2 text-xl font-bold leading-7 text-error">Authentication failed</Text>
            <Text className="text-base leading-6 text-center text-foreground">{errorMessage}</Text>
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

import { Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "./auth";

export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (Platform.OS !== "web") {
    const sessionToken = await Auth.getSessionToken();
    if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
  }

  const baseUrl = getApiBaseUrl();
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = baseUrl ? `${cleanBaseUrl}${cleanEndpoint}` : endpoint;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorText;
      } catch {
        // Keep plain-text server messages as provided.
      }
      throw new Error(errorMessage || `API call failed: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) return await response.json() as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Unknown error occurred");
  }
}

export async function exchangeOAuthCode(
  code: string,
  state: string,
): Promise<{ sessionToken: string; user: any }> {
  const params = new URLSearchParams({ code, state });
  const result = await apiCall<{ app_session_id: string; user: any }>(`/api/oauth/mobile?${params.toString()}`);
  return { sessionToken: result.app_session_id, user: result.user };
}

export async function logout(): Promise<void> {
  try {
    await apiCall<void>("/api/auth/password/logout", { method: "POST" });
  } catch {
    // Password logout is a no-op for OAuth sessions; continue clearing the OAuth cookie.
  }
  await apiCall<void>("/api/auth/logout", { method: "POST" });
}

export type PasswordAccountResult = {
  token?: string;
  expiresAt?: string;
  user: Auth.User;
};

function accountClient() {
  return Platform.OS === "web" ? "web" as const : "native" as const;
}

export async function registerPasswordAccount(input: { name: string; email: string; password: string }) {
  const result = await apiCall<PasswordAccountResult>("/api/auth/password/register", {
    method: "POST",
    body: JSON.stringify({ ...input, client: accountClient() }),
  });
  if (result.token) await Auth.setSessionToken(result.token);
  const user = { ...result.user, lastSignedIn: new Date(result.user.lastSignedIn) };
  await Auth.setUserInfo(user);
  return { ...result, user };
}

export async function loginWithPassword(input: { email: string; password: string }) {
  const result = await apiCall<PasswordAccountResult>("/api/auth/password/login", {
    method: "POST",
    body: JSON.stringify({ ...input, client: accountClient() }),
  });
  if (result.token) await Auth.setSessionToken(result.token);
  const user = { ...result.user, lastSignedIn: new Date(result.user.lastSignedIn) };
  await Auth.setUserInfo(user);
  return { ...result, user };
}

export async function getPasswordAccountMe(): Promise<Auth.User | null> {
  try {
    const result = await apiCall<{ user: Auth.User | null }>("/api/auth/password/me");
    if (!result.user) return null;
    const user = { ...result.user, lastSignedIn: new Date(result.user.lastSignedIn) };
    await Auth.setUserInfo(user);
    return user;
  } catch {
    return null;
  }
}

export async function getMe(): Promise<Auth.User | null> {
  try {
    const result = await apiCall<{ user: Auth.User | null }>("/api/auth/me");
    if (result.user) {
      const user = { ...result.user, lastSignedIn: new Date(result.user.lastSignedIn) } as Auth.User;
      await Auth.setUserInfo(user);
      return user;
    }
  } catch {
    // A password session is intentionally separate from the Manus OAuth session.
  }
  return getPasswordAccountMe();
}

export async function establishSession(token: string): Promise<boolean> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/auth/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });
    return response.ok;
  } catch {
    return false;
  }
}

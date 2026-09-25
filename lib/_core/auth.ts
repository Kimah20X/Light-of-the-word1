import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { SESSION_TOKEN_KEY, USER_INFO_KEY } from "@/constants/oauth";

export type User = {
  id: number | string;
  openId: string | null;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  authProvider?: "manus" | "password";
  lastSignedIn: Date;
};

export async function getSessionToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;
    return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setSessionToken(token: string): Promise<void> {
  if (Platform.OS === "web") return;
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function removeSessionToken(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  } catch {
    // A missing SecureStore item already represents a signed-out state.
  }
}

export async function getUserInfo(): Promise<User | null> {
  try {
    const info = Platform.OS === "web"
      ? window.localStorage.getItem(USER_INFO_KEY)
      : await SecureStore.getItemAsync(USER_INFO_KEY);
    if (!info) return null;
    const parsed = JSON.parse(info) as User;
    return {
      ...parsed,
      lastSignedIn: parsed.lastSignedIn instanceof Date ? parsed.lastSignedIn : new Date(parsed.lastSignedIn),
    };
  } catch {
    return null;
  }
}

export async function setUserInfo(user: User): Promise<void> {
  try {
    const serialized = JSON.stringify(user);
    if (Platform.OS === "web") {
      window.localStorage.setItem(USER_INFO_KEY, serialized);
    } else {
      await SecureStore.setItemAsync(USER_INFO_KEY, serialized);
    }
  } catch {
    // Authentication remains valid for this process even if device profile caching is unavailable.
  }
}

export async function clearUserInfo(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      window.localStorage.removeItem(USER_INFO_KEY);
    } else {
      await SecureStore.deleteItemAsync(USER_INFO_KEY);
    }
  } catch {
    // A missing profile cache is equivalent to signed out.
  }
}

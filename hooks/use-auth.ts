import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

type UseAuthOptions = {
  autoFetch?: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  const { autoFetch = true } = options ?? {};
  const [user, setUser] = useState<Auth.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    console.log("[useAuth] fetchUser called");
    try {
      setLoading(true);
      setError(null);

      const apiUser = await Api.getMe();
      if (apiUser) {
        const userInfo: Auth.User = {
          ...apiUser,
          lastSignedIn: apiUser.lastSignedIn instanceof Date ? apiUser.lastSignedIn : new Date(apiUser.lastSignedIn),
        };
        setUser(userInfo);
        await Auth.setUserInfo(userInfo);
        return;
      }

      // Keep an existing native account visible when offline; protected actions still need a connection.
      if (Platform.OS !== "web") {
        const cachedUser = await Auth.getUserInfo();
        setUser(cachedUser);
      } else {
        setUser(null);
        await Auth.clearUserInfo();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch user");
      setError(error);
      if (Platform.OS !== "web") {
        setUser(await Auth.getUserInfo());
      } else {
        setUser(null);
        await Auth.clearUserInfo();
      }
    } finally {
      setLoading(false);
      console.log("[useAuth] fetchUser completed, loading:", false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await Api.logout();
    } catch (err) {
      console.error("[Auth] Logout API call failed:", err);
      // Continue with logout even if API call fails
    } finally {
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
      setUser(null);
      setError(null);
    }
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  useEffect(() => {
    console.log("[useAuth] useEffect triggered, autoFetch:", autoFetch, "platform:", Platform.OS);
    if (autoFetch) {
      if (Platform.OS === "web") {
        // Web: fetch user from API directly (user will login manually if needed)
        console.log("[useAuth] Web: fetching user from API...");
        fetchUser();
      } else {
        // Native: show cached identity quickly while validating its session in the background
        Auth.getUserInfo().then((cachedUser) => {
          if (cachedUser) {
            setUser(cachedUser);
            setLoading(false);
          }
          fetchUser();
        });
      }
    } else {
      console.log("[useAuth] autoFetch disabled, setting loading to false");
      setLoading(false);
    }
  }, [autoFetch, fetchUser]);

  useEffect(() => {
    console.log("[useAuth] State updated:", {
      hasUser: !!user,
      loading,
      isAuthenticated,
      error: error?.message,
    });
  }, [user, loading, isAuthenticated, error]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    refresh: fetchUser,
    logout,
  };
}

import type { Express, Request, Response } from "express";
import { parse as parseCookieHeader } from "cookie";
import { z } from "zod";
import { createAccount, findAccountForSessionToken, revokeAccountSession, signInAccount } from "../account-auth";
import { getSessionCookieOptions } from "./cookies";

export const ACCOUNT_COOKIE_NAME = "ltw_account_session";

function accountCookieOptions(req: Request) {
  return { ...getSessionCookieOptions(req), domain: undefined };
}

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(320),
  password: z.string().min(10).max(128),
  client: z.enum(["web", "native"]).default("web"),
});
const loginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(128),
  client: z.enum(["web", "native"]).default("web"),
});

type AttemptWindow = { count: number; since: number };
const attempts = new Map<string, AttemptWindow>();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function attemptKey(req: Request, email: string) {
  return `${req.ip ?? req.socket.remoteAddress ?? "unknown"}:${email.toLowerCase()}`;
}

function isRateLimited(req: Request, email: string) {
  const key = attemptKey(req, email);
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || now - current.since >= ATTEMPT_WINDOW_MS) {
    attempts.set(key, { count: 1, since: now });
    if (attempts.size > 5000) {
      for (const [candidate, window] of attempts) if (now - window.since >= ATTEMPT_WINDOW_MS) attempts.delete(candidate);
    }
    return false;
  }
  current.count += 1;
  return current.count > MAX_ATTEMPTS;
}

function clearAttempts(req: Request, email: string) {
  attempts.delete(attemptKey(req, email));
}

function getAccountToken(req: Request) {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim();
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  return cookies[ACCOUNT_COOKIE_NAME];
}

function sendSession(req: Request, res: Response, result: { token: string; expiresAt: Date; user: unknown }, client: "web" | "native") {
  if (client === "web") {
    res.cookie(ACCOUNT_COOKIE_NAME, result.token, {
      ...accountCookieOptions(req),
      maxAge: result.expiresAt.getTime() - Date.now(),
    });
    res.json({ user: result.user });
    return;
  }
  res.json({ token: result.token, user: result.user, expiresAt: result.expiresAt.toISOString() });
}

export function registerAccountAuthRoutes(app: Express) {
  app.post("/api/auth/password/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Enter a name, valid email, and password with at least 10 characters." });
      return;
    }
    if (isRateLimited(req, parsed.data.email)) {
      res.status(429).json({ error: "Too many account requests. Please wait and try again." });
      return;
    }
    try {
      const result = await createAccount(parsed.data);
      clearAttempts(req, parsed.data.email);
      sendSession(req, res, result, parsed.data.client);
    } catch (error) {
      if ((error as { code?: number })?.code === 11000) {
        res.status(409).json({ error: "Unable to create an account with these details. If you already have an account, sign in." });
        return;
      }
      console.error("[Account] Registration failed", error instanceof Error ? error.message : "unknown error");
      res.status(503).json({ error: "Account service is unavailable. Check MongoDB configuration and try again." });
    }
  });

  app.post("/api/auth/password/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Enter a valid email address and password." });
      return;
    }
    if (isRateLimited(req, parsed.data.email)) {
      res.status(429).json({ error: "Too many sign-in attempts. Please wait and try again." });
      return;
    }
    try {
      const result = await signInAccount(parsed.data.email, parsed.data.password);
      if (!result) {
        res.status(401).json({ error: "Email or password is incorrect." });
        return;
      }
      clearAttempts(req, parsed.data.email);
      sendSession(req, res, result, parsed.data.client);
    } catch (error) {
      console.error("[Account] Sign-in failed", error instanceof Error ? error.message : "unknown error");
      res.status(503).json({ error: "Account service is unavailable. Check MongoDB configuration and try again." });
    }
  });

  app.get("/api/auth/password/me", async (req, res) => {
    const token = getAccountToken(req);
    if (!token) {
      res.status(401).json({ error: "Not authenticated", user: null });
      return;
    }
    try {
      const user = await findAccountForSessionToken(token);
      if (!user) {
        res.status(401).json({ error: "Not authenticated", user: null });
        return;
      }
      res.json({ user });
    } catch (error) {
      console.error("[Account] Account lookup failed", error instanceof Error ? error.message : "unknown error");
      res.status(503).json({ error: "Account service is unavailable.", user: null });
    }
  });

  app.post("/api/auth/password/logout", async (req, res) => {
    const token = getAccountToken(req);
    try {
      if (token) await revokeAccountSession(token);
    } catch (error) {
      console.error("[Account] Session revocation failed", error instanceof Error ? error.message : "unknown error");
    }
    res.clearCookie(ACCOUNT_COOKIE_NAME, { ...accountCookieOptions(req), maxAge: 0 });
    res.json({ success: true });
  });
}

export function resetAccountRouteAttemptLimiterForTests() {
  attempts.clear();
}

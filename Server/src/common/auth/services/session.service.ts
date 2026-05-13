import { redis } from "../../config/redis.config";
import { env } from "../../config/env.config";
import type { OAuthSessionData } from "../types/oidc.types";

const TTL = env.OAUTH_SESSION_TTL_SECONDS;

function key(state: string): string {
  return `oauth:${state}`;
}

export async function saveOAuthSession(
  state: string,
  data: OAuthSessionData,
): Promise<void> {
  const result = await redis.set(
    key(state),
    JSON.stringify(data),
    "EX",
    TTL,
  );
  if (result !== "OK") {
    throw new Error(`Redis SET returned unexpected value: ${result}`);
  }
}

export async function consumeOAuthSession(
  state: string,
): Promise<OAuthSessionData | null> {
  const raw = await redis.getdel(key(state));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as OAuthSessionData;
    const ageMs = Date.now() - parsed.createdAt;
    if (ageMs > TTL * 1000) {
      console.warn("[session] OAuth session expired (age guard)", { state });
      return null;
    }

    return parsed;
  } catch {
    console.error("[session] Failed to parse OAuth session", { state });
    return null;
  }
}
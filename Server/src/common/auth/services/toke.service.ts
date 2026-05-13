import jwt from "jsonwebtoken";
import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { db } from "../../config/database.config";
import { refreshTokens } from "../../schema/auth.schema";
import { env } from "../../config/env.config";
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  AuthTokens,
  AuthUser,
} from "../types/auth.types";

export function issueAccessToken(user: AuthUser): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    type: "access",
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  if (payload.type !== "access") {
    throw new Error("Invalid token type");
  }
  return payload;
}


function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function issueRefreshToken(userId: string): Promise<string> {
  const jti = crypto.randomUUID();
  const raw = crypto.randomBytes(40).toString("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.insert(refreshTokens).values({
    userId,
    token: hashToken(raw),
    expiresAt,
  });

  const payload: RefreshTokenPayload = { sub: userId, type: "refresh", jti };
  const signed = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
  return raw + "." + signed; 
}

export async function rotateRefreshToken(
  rawAndSigned: string,
  userId: string,
): Promise<{ newRaw: string; payload: RefreshTokenPayload }> {
  const [raw, signed] = splitRefreshToken(rawAndSigned);

  const payload = jwt.verify(signed, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  if (payload.type !== "refresh" || payload.sub !== userId) {
    throw new Error("Invalid refresh token");
  }

  const hashed = hashToken(raw);
  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.token, hashed),
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.revoked, false),
      ),
    )
    .limit(1);

  if (!stored || stored.expiresAt < new Date()) {
    throw new Error("Refresh token not found, expired, or revoked");
  }

  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.id, stored.id));

  const newRaw = await issueRefreshToken(userId);
  return { newRaw, payload };
}

export async function revokeRefreshToken(rawAndSigned: string, userId: string): Promise<void> {
  const [raw] = splitRefreshToken(rawAndSigned);
  const hashed = hashToken(raw);
  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(
      and(eq(refreshTokens.token, hashed), eq(refreshTokens.userId, userId)),
    );
}

function splitRefreshToken(combined: string): [string, string] {
  const dotIndex = combined.lastIndexOf(".");
  const firstDot = combined.indexOf(".");
  if (firstDot === -1) throw new Error("Malformed refresh token");
  return [combined.slice(0, firstDot), combined.slice(firstDot + 1)];
}

export async function issueAuthTokens(user: AuthUser): Promise<AuthTokens> {
  const [accessToken, refreshToken] = await Promise.all([
    issueAccessToken(user),
    issueRefreshToken(user.id),
  ]);
  return { accessToken, refreshToken };
}
import { eq } from "drizzle-orm";
import { db } from "../../common/config/db.config";
import { users } from "../../common/schema/user.schema";
import { oauthAccounts } from "../../common/schema/oauth.schema";
import { issueAuthTokens } from "../../common/auth/services/token.service";
import type { GoogleIdTokenClaims } from "../../common/auth/types/auth.types";
import type { AuthTokens, AuthUser } from "../../common/auth/types/auth.types";

export async function upsertGoogleUser(claims: GoogleIdTokenClaims): Promise<AuthTokens> {
  // 1. Check if this Google account is already linked
  const [existingOAuth] = await db
    .select({ userId: oauthAccounts.userId })
    .from(oauthAccounts)
    .where(eq(oauthAccounts.providerAccountId, claims.sub))
    .limit(1);

  if (existingOAuth) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, existingOAuth.userId))
      .limit(1);

    if (!user) throw new Error("Linked user not found");
    return issueAuthTokens(toAuthUser(user));
  }

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, claims.email))
    .limit(1);

  if (existingUser) {
    await db.insert(oauthAccounts).values({
      userId: existingUser.id,
      provider: "google",
      providerAccountId: claims.sub,
    });
    return issueAuthTokens(toAuthUser(existingUser));
  }

  const username = await generateUsername(claims);

  const [newUser] = await db
    .insert(users)
    .values({
      email: claims.email,
      username,
      emailVerified: true,    
      passwordHash: null,     
    })
    .returning();

  await db.insert(oauthAccounts).values({
    userId: newUser.id,
    provider: "google",
    providerAccountId: claims.sub,
  });

  return issueAuthTokens(toAuthUser(newUser));
}

function toAuthUser(user: typeof users.$inferSelect): AuthUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role ?? "user",
    emailVerified: user.emailVerified ?? true,
  };
}

async function generateUsername(claims: GoogleIdTokenClaims): Promise<string> {
  const base = (claims.name ?? claims.email.split("@")[0])
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 40);

  const [existing] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.username, base))
    .limit(1);

  if (!existing) return base;
  return `${base}_${Math.random().toString(36).slice(2, 7)}`;
}
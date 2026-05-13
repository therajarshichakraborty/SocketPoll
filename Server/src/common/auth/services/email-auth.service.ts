import bcrypt from "bcrypt";
import crypto from "crypto";
import { eq, or } from "drizzle-orm";
import { db } from "../../config/database.config";
import { users } from "../../schema/user.schema";
import { emailVerificationTokens, passwordResetTokens } from "../../schema/auth.schema";
import { sendVerificationEmail, sendPasswordResetEmail } from "./mailer.service";
import { issueAuthTokens } from "./toke.service";
import type { RegisterDto, LoginDto } from "../dto/auth.dto";
import type { AuthTokens, AuthUser } from "../types/auth.types";

export async function registerWithEmail(dto: RegisterDto): Promise<void> {
  const existing = await db
    .select({ id: users.id, email: users.email, username: users.username })
    .from(users)
    .where(or(eq(users.email, dto.email), eq(users.username, dto.username)))
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].email === dto.email) {
      throw new AuthError("EMAIL_TAKEN", "An account with this email already exists");
    }
    throw new AuthError("USERNAME_TAKEN", "This username is already taken");
  }

  const passwordHash = await bcrypt.hash(dto.password, 12);

  const [newUser] = await db
    .insert(users)
    .values({
      username: dto.username,
      email: dto.email,
      passwordHash,
      emailVerified: false,
    })
    .returning({ id: users.id, username: users.username });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.insert(emailVerificationTokens).values({
    userId: newUser.id,
    token,
    expiresAt,
  });

  sendVerificationEmail(dto.email, newUser.username, token).catch((err) => {
    console.error("[mailer] Failed to send verification email:", err.message);
  });
}

export async function verifyEmail(token: string): Promise<void> {
  const [record] = await db
    .select()
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.token, token))
    .limit(1);

  if (!record) {
    throw new AuthError("INVALID_TOKEN", "Verification link is invalid or has already been used");
  }
  if (record.expiresAt < new Date()) {
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, record.id));
    throw new AuthError("TOKEN_EXPIRED", "Verification link has expired. Please register again.");
  }

  await Promise.all([
    db.update(users).set({ emailVerified: true }).where(eq(users.id, record.userId)),
    db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, record.id)),
  ]);
}

export async function loginWithEmail(dto: LoginDto): Promise<AuthTokens> {
  const isEmail = dto.identifier.includes("@");
  const [user] = await db
    .select()
    .from(users)
    .where(isEmail ? eq(users.email, dto.identifier) : eq(users.username, dto.identifier))
    .limit(1);
  if (!user || !user.passwordHash) {
    throw new AuthError("INVALID_CREDENTIALS", "Invalid email/username or password");
  }

  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid) {
    throw new AuthError("INVALID_CREDENTIALS", "Invalid email/username or password");
  }

  if (!user.emailVerified) {
    throw new AuthError("EMAIL_NOT_VERIFIED", "Please verify your email before logging in");
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role ?? "user",
    emailVerified: user.emailVerified ?? false,
  };

  return issueAuthTokens(authUser);
}

export async function forgotPassword(email: string): Promise<void> {
  const [user] = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await db
    .insert(passwordResetTokens)
    .values({ userId: user.id, token, expiresAt })
    .onConflictDoUpdate({
      target: passwordResetTokens.userId,
      set: { token, expiresAt, used: false },
    });

  sendPasswordResetEmail(email, user.username, token).catch((err) => {
    console.error("[mailer] Failed to send reset email:", err.message);
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const [record] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);

  if (!record || record.used) {
    throw new AuthError("INVALID_TOKEN", "Reset link is invalid or has already been used");
  }
  if (record.expiresAt < new Date()) {
    throw new AuthError("TOKEN_EXPIRED", "Reset link has expired. Please request a new one.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await Promise.all([
    db.update(users).set({ passwordHash }).where(eq(users.id, record.userId)),
    db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, record.id)),
  ]);
}

export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

import type { Request, Response } from "express";
import { registerDto, loginDto, forgotPasswordDto, resetPasswordDto } from "../dto/auth.dto";
import {
  registerWithEmail,
  loginWithEmail,
  verifyEmail,
  forgotPassword,
  resetPassword,
  AuthError,
} from "../services/email-auth.service";
import {
  issueAuthTokens,
  rotateRefreshToken,
  revokeRefreshToken,
} from "../services/toke.service";
import { getGoogleProvider } from "../providers/google.provider";
import { generateAuthUrl, handleOIDCCallback, OIDCError } from "../services/oidc.service";
import { env } from "../../config/env.config";

const REFRESH_COOKIE = "refresh_token";
const isProd = env.NODE_ENV === "production";

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
  });
}

function handleAuthError(err: unknown, res: Response): void {
  if (err instanceof AuthError || err instanceof OIDCError) {
    res.status(400).json({ success: false, code: err.code, message: err.message });
    return;
  }
  console.error("[auth] Unexpected error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const dto = registerDto.parse(req.body);
    await registerWithEmail(dto);
    res.status(201).json({
      success: true,
      message: "Account created. Please check your email to verify your account.",
    });
  } catch (err) {
    handleAuthError(err, res);
  }
}

export async function verifyEmailHandler(req: Request, res: Response): Promise<void> {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ success: false, message: "Token is required" });
      return;
    }
    await verifyEmail(token);
    res.json({ success: true, message: "Email verified. You can now log in." });
  } catch (err) {
    handleAuthError(err, res);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const dto = loginDto.parse(req.body);
    const { accessToken, refreshToken } = await loginWithEmail(dto);
    setRefreshCookie(res, refreshToken);
    res.json({ success: true, accessToken });
  } catch (err) {
    handleAuthError(err, res);
  }
}

export async function refreshTokenHandler(req: Request, res: Response): Promise<void> {
  try {
    const oldToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!oldToken) {
      res.status(401).json({ success: false, message: "No refresh token" });
      return;
    }

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { newRaw } = await rotateRefreshToken(oldToken, userId);
    const { accessToken } = await issueAuthTokens(req.user!);
    setRefreshCookie(res, newRaw);
    res.json({ success: true, accessToken });
  } catch (err) {
    handleAuthError(err, res);
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (token && req.user) {
      await revokeRefreshToken(token, req.user.id).catch(() => {
      });
    }
    clearRefreshCookie(res);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    handleAuthError(err, res);
  }
}

export async function forgotPasswordHandler(req: Request, res: Response): Promise<void> {
  try {
    const dto = forgotPasswordDto.parse(req.body);
    await forgotPassword(dto.email);
    // Always same response — prevents email enumeration
    res.json({ success: true, message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    handleAuthError(err, res);
  }
}
export async function resetPasswordHandler(req: Request, res: Response): Promise<void> {
  try {
    const dto = resetPasswordDto.parse(req.body);
    await resetPassword(dto.token, dto.password);
    res.json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (err) {
    handleAuthError(err, res);
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  res.json({ success: true, user: req.user });
}

export async function googleLogin(req: Request, res: Response): Promise<void> {
  try {
    const provider = getGoogleProvider();
    const authUrl = await generateAuthUrl(provider);
    res.redirect(authUrl);
  } catch (err) {
    handleAuthError(err, res);
  }
}

export async function googleCallback(req: Request, res: Response): Promise<void> {
  const { state, error } = req.query as Record<string, string>;

  if (error) {
    res.redirect(`${env.CLIENT_URL}/auth/error?code=${encodeURIComponent(error)}`);
    return;
  }
  if (!state) {
    res.status(400).json({ success: false, message: "Missing state" });
    return;
  }

  try {
    const provider = getGoogleProvider();
    const callbackUrl = new URL(req.originalUrl, `${req.protocol}://${req.get("host")}`);
    const { claims } = await handleOIDCCallback(provider, callbackUrl, state);

    res.json({ success: true, claims });
  } catch (err) {
    handleAuthError(err, res);
  }
}
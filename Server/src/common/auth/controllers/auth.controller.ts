import type { Request, Response } from "express";
import { getGoogleProvider } from "../providers/google.provider";
import { generateAuthUrl, handleOIDCCallback, OIDCError } from "../services/oidc.service";
import { env } from "../../config/env.config";

export async function googleLogin(req: Request, res: Response): Promise<void> {
  try {
    const provider = getGoogleProvider();
    const authUrl = await generateAuthUrl(provider);
    res.redirect(authUrl);
  } catch (err) {
    console.error("[auth] googleLogin error:", err);
    res.status(500).json({ message: "Failed to initiate Google login" });
  }
}
export async function logout(req: Request, res: Response): Promise<void> {
  res.clearCookie("user_sub", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    domain: env.COOKIE_DOMAIN,
  });

  res.json({ success: true, message: "Logged out successfully" });
}

export async function googleCallback(req: Request, res: Response): Promise<void> {
  const { state, error, error_description } = req.query as Record<string, string>;
  if (error) {
    console.warn("[auth] Google returned an error:", error, error_description);
    res.redirect(
      `${env.FRONTEND_URL}/auth/error?code=${encodeURIComponent(error)}`,
    );
    return;
  }

  if (!state) {
    res.status(400).json({ message: "Missing state parameter" });
    return;
  }

  try {
    const provider = getGoogleProvider();
    const callbackUrl = new URL(
      req.originalUrl,
      `${req.protocol}://${req.get("host")}`,
    );

    const { claims } = await handleOIDCCallback(provider, callbackUrl, state);
    res.cookie("user_sub", claims.sub, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      domain: env.COOKIE_DOMAIN,
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    console.info("[auth] Login successful", {
      sub: claims.sub,
      email: claims.email,
    });

    res.redirect(`${env.FRONTEND_URL}/health`);
  } catch (err) {
    if (err instanceof OIDCError) {
      console.warn("[auth] OIDC validation error:", err.code, err.message);
      res.redirect(
        `${env.FRONTEND_URL}/auth/error?code=${encodeURIComponent(err.code)}`,
      );
      return;
    }
    console.error("[auth] Unexpected callback error:", err);
    res.status(500).json({ message: "Authentication failed" });
  }
}
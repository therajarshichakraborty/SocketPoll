import { env } from "../../config/env.config";
import { createOIDCProvider } from "./oidc.factory";
import type { OIDCProvider } from "../types/oidc.types";


let _googleProvider: OIDCProvider | null = null;

export async function initGoogleProvider(): Promise<void> {
  _googleProvider = await createOIDCProvider({
    name: "google",
    issuer: "https://accounts.google.com",
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_REDIRECT_URI,
    scopes: ["openid", "email", "profile"],
  });
}

export function getGoogleProvider(): OIDCProvider {
  if (!_googleProvider) {
    throw new Error(
      "Google OIDC provider not initialised. Call initGoogleProvider() during app startup.",
    );
  }
  return _googleProvider;
}
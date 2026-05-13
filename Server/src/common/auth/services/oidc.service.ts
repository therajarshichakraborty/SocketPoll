import crypto from "crypto";
import * as client from "openid-client";
import { generatePKCE } from "../utils/pkce";
import { saveOAuthSession, consumeOAuthSession } from "./session.service";
import type { OIDCProvider, GoogleIdTokenClaims } from "../types/oidc.types";

export async function generateAuthUrl(provider: OIDCProvider): Promise<string> {
  const { codeVerifier, codeChallenge } = await generatePKCE();
  const state = crypto.randomUUID();

  await saveOAuthSession(state, {
    codeVerifier,
    provider: provider.name,
    createdAt: Date.now(),
  });

  const authUrl = client.buildAuthorizationUrl(provider.config, {
    scope: provider.scopes.join(" "),
    redirect_uri: provider.redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });

  return authUrl.href;
}


export interface CallbackResult {
  claims: GoogleIdTokenClaims;
  accessToken: string;
}

export async function handleOIDCCallback(
  provider: OIDCProvider,
  callbackUrl: URL,          
  sessionState: string,      
): Promise<CallbackResult> {
  const session = await consumeOAuthSession(sessionState);
  if (!session) {
    throw new OIDCError("invalid_state", "OAuth session not found or expired");
  }
  if (session.provider !== provider.name) {
    throw new OIDCError("invalid_state", "Provider mismatch in OAuth session");
  }

  let tokens: client.TokenEndpointResponse;
  try {
    tokens = await client.authorizationCodeGrant(provider.config, callbackUrl, {
      pkceCodeVerifier: session.codeVerifier,
      expectedState: sessionState,
    });
  } catch (err) {
    throw new OIDCError(
      "token_exchange_failed",
      `Token exchange failed: ${(err as Error).message}`,
    );
  }

  const rawClaims = tokens.claims();
  if (!rawClaims) {
    throw new OIDCError("missing_id_token", "No ID token returned from provider");
  }
  if (!rawClaims.email_verified) {
    throw new OIDCError("email_not_verified", "Google account email is not verified");
  }

  const claims: GoogleIdTokenClaims = {
    sub: rawClaims.sub,
    email: rawClaims["email"] as string,
    email_verified: rawClaims["email_verified"] as boolean,
    name: rawClaims["name"] as string | undefined,
    picture: rawClaims["picture"] as string | undefined,
    given_name: rawClaims["given_name"] as string | undefined,
    family_name: rawClaims["family_name"] as string | undefined,
    iat: rawClaims.iat!,
    exp: rawClaims.exp!,
  };

  return {
    claims,
    accessToken: tokens.access_token,
  };
}

export class OIDCError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "OIDCError";
  }
}
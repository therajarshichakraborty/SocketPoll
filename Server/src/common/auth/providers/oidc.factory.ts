import * as client from "openid-client";
import type { OIDCProvider, OIDCProviderConfig } from "../types/oidc.types";

export async function createOIDCProvider(
  options: OIDCProviderConfig,
): Promise<OIDCProvider> {
  const config = await client.discovery(
    new URL(options.issuer),
    options.clientId,
    options.clientSecret,
  );

  return {
    name: options.name,
    config,
    redirectUri: options.redirectUri,
    scopes: options.scopes,
  };
}
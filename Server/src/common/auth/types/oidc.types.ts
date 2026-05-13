import * as client from "openid-client";

export interface OIDCProviderConfig {
  name: string;
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface OIDCProvider {
  name: string;
  config: client.Configuration;
  redirectUri: string;
  scopes: string[];
}

export interface OAuthSessionData {
  codeVerifier: string;
  provider: string;      
  createdAt: number;     
}

export interface GoogleIdTokenClaims {
  sub: string;           
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  iat: number;
  exp: number;
}
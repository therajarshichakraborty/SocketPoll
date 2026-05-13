import * as client from "openid-client";

export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}
export async function generatePKCE(): Promise<PKCEPair> {
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
}
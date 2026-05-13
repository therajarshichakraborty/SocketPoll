export interface AccessTokenPayload {
  sub: string;
  email: string;
  username: string;
  role: string;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  type: "refresh";
  jti: string;
}
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
  emailVerified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

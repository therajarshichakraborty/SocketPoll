import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  createUserRepository,
  findUserByEmailRepository,
  findUserByIdRepository,
} from "./auth.repository";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../common/utils/api.error";
import { RegisterDTO, LoginDTO } from "./auth.dto";
import { env } from "../../common/config/env.config";

const JWT_SECRET = env.JWT_ACCESS_SECRET!;
const JWT_EXPIRES_IN = env.JWT_ACCESS_EXPIRES_IN || "7d";

function signToken(payload: { id: string; email: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

// ── Register ──────────────────────────────────────────────────────────────────

export async function registerService(data: RegisterDTO) {
  // Check duplicate email
  const existing = await findUserByEmailRepository(data.email);
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await createUserRepository({
    name: data.name,
    email: data.email,
    password: hashedPassword,
  });

  const token = signToken({ id: user.id, email: user.email });

  return { user, token };
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function loginService(data: LoginDTO) {
  // Find user (with password this time)
  const user = await findUserByEmailRepository(data.email);
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (!user.password) {
    throw new BadRequestError("This account uses social login. Please sign in with Google.");
  }

  // Compare password
  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = signToken({ id: user.id, email: user.email });

  // Return user without password
  const { password: _, ...safeUser } = user;

  return { user: safeUser, token };
}

// ── Get current user ──────────────────────────────────────────────────────────

export async function getMeService(userId: string) {
  const user = await findUserByIdRepository(userId);
  if (!user) throw new NotFoundError("User");
  return user;
}

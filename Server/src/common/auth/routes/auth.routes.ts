import { Router } from "express";
import {
  register,
  verifyEmailHandler,
  login,
  refreshTokenHandler,
  logout,
  forgotPasswordHandler,
  resetPasswordHandler,
  getMe,
  googleLogin,
  googleCallback,
} from "../controllers/auth.controller";
import { loginRateLimit } from "../../middleware/rate-limit.middleware";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.post("/register", loginRateLimit, register);
router.get("/verify-email", verifyEmailHandler);
router.post("/login", loginRateLimit, login);
router.post("/refresh-token", requireAuth, refreshTokenHandler);
router.post("/logout", logout);
router.post("/forgot-password", loginRateLimit, forgotPasswordHandler);
router.post("/reset-password", resetPasswordHandler);

router.get("/me", requireAuth, getMe);

router.get("/google/login", loginRateLimit, googleLogin);
router.get("/google/callback", googleCallback);

export default router;
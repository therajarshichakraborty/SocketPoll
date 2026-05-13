import { Router } from "express";
import { googleLogin, googleCallback } from "../controllers/auth.controller";
import { loginRateLimit } from "../../middleware/rate-limit.middleware";
import { googleLogin, googleCallback, logout } from "../controllers/auth.controller";


const router = Router();

router.post("/logout", logout);
router.get("/google/login", loginRateLimit, googleLogin);
router.get("/google/callback", googleCallback);

export default router;
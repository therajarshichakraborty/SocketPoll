import { Router } from "express";
import { authenticate } from "../../common/middleware/auth.middleware";
import { registerController, loginController, getMeController } from "./auth.controller";

const router = Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.get("/me", authenticate, getMeController);

export default router;

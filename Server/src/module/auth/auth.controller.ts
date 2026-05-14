import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/async-handler";
import { registerValidator, loginValidator } from "./auth.validator";
import { registerService, loginService, getMeService } from "./auth.service";

// POST /api/auth/register
export const registerController = asyncHandler(async (req: Request, res: Response) => {
  const data = registerValidator.parse(req.body);
  const result = await registerService(data);
  return res.status(201).json({ success: true, data: result });
});

// POST /api/auth/login
export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const data = loginValidator.parse(req.body);
  const result = await loginService(data);
  return res.json({ success: true, data: result });
});

// GET /api/auth/me
export const getMeController = asyncHandler(async (req: Request, res: Response) => {
  const user = await getMeService(req.user!.id);
  return res.json({ success: true, data: user });
});

import { Router } from "express";
import { authenticate, optionalAuthenticate } from "../../common/middleware/auth.middleware";
import {
  createPollController,
  closePollController,
  deletePollController,
  getMyPollsController,
  getPollController,
  publishPollController,
  reopenPollController,
  updatePollController,
} from "./poll.controller";

const router = Router();

// ⚠️ /me MUST be before /:pollId or Express treats "me" as a pollId
router.get("/me", authenticate, getMyPollsController);

// Public
router.get("/:pollId", optionalAuthenticate, getPollController);

// Authenticated
router.post("/", authenticate, createPollController);
router.patch("/:pollId", authenticate, updatePollController);
router.patch("/:pollId/publish", authenticate, publishPollController);
router.patch("/:pollId/close", authenticate, closePollController);
router.patch("/:pollId/reopen", authenticate, reopenPollController);
router.delete("/:pollId", authenticate, deletePollController);

export default router;

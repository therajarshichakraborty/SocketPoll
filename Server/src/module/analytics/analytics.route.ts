import { Router } from "express";
import { authenticate, optionalAuthenticate } from "../../common/middleware/auth.middleware";
import {
  getPollResultsController,
  getPollSummaryController,
  getTrendingPollsController,
  getVoteTimelineController,
} from "./analytics.controller";

const router = Router({ mergeParams: true });

// Public
router.get("/trending", getTrendingPollsController);
router.get("/:pollId/results", getPollResultsController);

// Creator only
router.get(
  "/:pollId/summary",
  authenticate,
  getPollSummaryController
);

router.get(
  "/:pollId/timeline",
  authenticate,
  getVoteTimelineController
);

export default router;
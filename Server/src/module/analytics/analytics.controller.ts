import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/async-handler";
import {
  getPollResultsService,
  getPollSummaryService,
  getTrendingPollsService,
  getVoteTimelineService,
} from "./analytics.service";

// GET /polls/:pollId/results  (public)
export const getPollResultsController = asyncHandler(async (req: Request | any, res: Response) => {
  const data = await getPollResultsService(req.params.pollId, req.user?.id);
  return res.json({ success: true, data });
});

// GET /polls/:pollId/summary  (creator only)
export const getPollSummaryController = asyncHandler(async (req: Request | any, res: Response) => {
  const data = await getPollSummaryService(req.params.pollId, req.user!.id);
  return res.json({ success: true, data });
});

// GET /polls/:pollId/timeline  (creator only)
export const getVoteTimelineController = asyncHandler(async (req: Request | any, res: Response) => {
  const data = await getVoteTimelineService(req.params.pollId, req.user!.id);
  return res.json({ success: true, data });
});

// GET /polls/trending  (public)
export const getTrendingPollsController = asyncHandler(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 10;
  const data = await getTrendingPollsService(limit);
  return res.json({ success: true, data });
});

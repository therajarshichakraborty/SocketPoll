import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/async-handler";
import { castVoteValidator } from "./vote.validator";
import { castVoteService } from "./vote.service";

export const castVoteController = asyncHandler(async (req: Request|any, res: Response) => {
  const data = castVoteValidator.parse(req.body);
  const result = await castVoteService(req.params.pollId, data, req.user?.id);
  return res.status(201).json({ success: true, data: result });
});

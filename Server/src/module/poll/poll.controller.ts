import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/async-handler";
import { createPollValidator, updatePollValidator, pollQueryValidator } from "./poll.validator";
import {
  closePollService,
  createPollService,
  deletePollService,
  getMyPollsService,
  getPollService,
  publishPollService,
  reopenPollService,
  updatePollService,
} from "./poll.service";

export const createPollController = asyncHandler(
  async (req: Request, res: Response) => {

    console.log("RAW BODY:");
    console.log(JSON.stringify(req.body, null, 2));

    const result = createPollValidator.safeParse(req.body);

    if (!result.success) {
      console.log("ZOD ERROR:");
      console.log(result.error.flatten());

      return res.status(400).json({
        success: false,
        errors: result.error.flatten(),
      });
    }

    const poll = await createPollService(
      req.user!.id,
      result.data
    );

    return res.status(201).json({
      success: true,
      data: poll,
    });
  }
);

export const getMyPollsController = asyncHandler(async (req: Request, res: Response) => {
  const query = pollQueryValidator.parse(req.query);
  const result = await getMyPollsService(req.user!.id, query);
  return res.json({ success: true, ...result });
});

export const getPollController = asyncHandler(async (req: Request|any, res: Response) => {
  const poll = await getPollService(req.params.pollId, req.user?.id);
  return res.json({ success: true, data: poll });
});

export const updatePollController = asyncHandler(async (req: Request, res: Response) => {
  const data = updatePollValidator.parse(req.body);
  const poll = await updatePollService(req.params.pollId, req.user!.id, data);
  return res.json({ success: true, data: poll });
});

export const publishPollController = asyncHandler(async (req: Request, res: Response) => {
  const poll = await publishPollService(req.params.pollId, req.user!.id);
  return res.json({ success: true, data: poll });
});

export const closePollController = asyncHandler(async (req: Request, res: Response) => {
  const poll = await closePollService(req.params.pollId, req.user!.id);
  return res.json({ success: true, data: poll });
});

export const reopenPollController = asyncHandler(async (req: Request, res: Response) => {
  const poll = await reopenPollService(req.params.pollId, req.user!.id);
  return res.json({ success: true, data: poll });
});

export const deletePollController = asyncHandler(async (req: Request, res: Response) => {
  await deletePollService(req.params.pollId, req.user!.id);
  return res.json({ success: true, message: "Poll deleted" });
});

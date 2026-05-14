import { Router } from "express";
import { optionalAuthenticate } from "../../common/middleware/auth.middleware";
import { castVoteController } from "./vote.controller";

const router = Router({ mergeParams: true });

router.post("/", optionalAuthenticate, castVoteController);

export default router;

import {
  getPollResultsRepository,
  getPollSummaryRepository,
  getTrendingPollsRepository,
  getVoteTimelineRepository,
} from "./analytics.repository";
import { getPollOwnerRepository } from "../poll/poll.repository";
import { ForbiddenError, NotFoundError } from "../../common/utils/api.error";

// ── Public: results for a specific poll ───────────────────────────────────────

export async function getPollResultsService(pollId: string, requesterId?: string) {
  const poll = await getPollOwnerRepository(pollId);
  if (!poll) throw new NotFoundError("Poll");

  // Anonymous poll: only creator sees individual breakdown
  // Public results are still returned — just without voter info (handled at schema level)
  return getPollResultsRepository(pollId);
}

// ── Creator only: full summary ────────────────────────────────────────────────

export async function getPollSummaryService(pollId: string, requesterId: string) {
  const poll = await getPollOwnerRepository(pollId);
  if (!poll) throw new NotFoundError("Poll");
  if (poll.creatorId !== requesterId) {
    throw new ForbiddenError("Only the poll creator can view this summary");
  }

  return getPollSummaryRepository(pollId);
}

// ── Creator only: vote activity timeline ──────────────────────────────────────

export async function getVoteTimelineService(pollId: string, requesterId: string) {
  const poll = await getPollOwnerRepository(pollId);
  if (!poll) throw new NotFoundError("Poll");
  if (poll.creatorId !== requesterId) {
    throw new ForbiddenError("Only the poll creator can view analytics");
  }

  return getVoteTimelineRepository(pollId);
}

// ── Public: trending polls ────────────────────────────────────────────────────

export async function getTrendingPollsService(limit = 10) {
  return getTrendingPollsRepository(limit);
}

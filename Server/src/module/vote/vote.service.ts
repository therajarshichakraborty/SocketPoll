import {
  castVoteRepository,
  findExistingResponseRepository,
  getRequiredQuestionsRepository,
  validateOptionOwnershipRepository,
} from "./vote.repository";
import { getPollByIdRepository } from "../../module/poll/poll.repository";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../common/utils/api.error";
import { CastVoteDTO } from "./vote.dto";
import { emitVoteUpdate } from "../poll/poll.event"

export async function castVoteService(pollId: string, data: CastVoteDTO, userId?: string) {
  // ── 1. Load poll ───────────────────────────────────────────────────────────
  const poll = await getPollByIdRepository(pollId);
  if (!poll) throw new NotFoundError("Poll");

  // ── 2. Poll must be published ──────────────────────────────────────────────
  if (!poll.isPublished) {
    throw new ForbiddenError("This poll is not open for voting");
  }

  // ── 3. Poll must not be closed ─────────────────────────────────────────────
  if (poll.isClosed) {
    throw new BadRequestError("This poll is closed");
  }

  // ── 4. Check expiry ────────────────────────────────────────────────────────
  if (poll.expiresAt && poll.expiresAt < new Date()) {
    throw new BadRequestError("This poll has expired");
  }

  // ── 5. Auth check ─────────────────────────────────────────────────────────
  if (poll.requireAuth && !userId) {
    throw new ForbiddenError("You must be logged in to vote on this poll");
  }

  // ── 6. Anonymous id required for anonymous polls with no user ─────────────
  const anonymousId = !userId ? data.anonymousId : undefined;
  if (!userId && !anonymousId) {
    throw new BadRequestError(
      "Anonymous ID required to track your vote. Please provide anonymousId."
    );
  }

  // ── 7. Duplicate vote check ────────────────────────────────────────────────
  const existing = await findExistingResponseRepository(pollId, userId, anonymousId);
  if (existing) {
    throw new ConflictError("You have already voted on this poll");
  }

  // ── 8. All required questions must be answered ────────────────────────────
  const requiredQuestions = await getRequiredQuestionsRepository(pollId);
  const answeredQuestionIds = new Set(Object.keys(data.answers));
  const missingRequired = requiredQuestions.filter((q: any) => !answeredQuestionIds.has(q.id));
  if (missingRequired.length > 0) {
    throw new BadRequestError(
      `Missing answers for required questions: ${missingRequired
        .map((q: any) => q.question)
        .join(", ")}`
    );
  }

  // ── 9. No answers for questions not in this poll ──────────────────────────
  const validQuestionIds = new Set(poll.questions.map((q: any) => q.id));
  const invalidQuestions = Object.keys(data.answers).filter(
    (qId) => !validQuestionIds.has(qId)
  );
  if (invalidQuestions.length > 0) {
    throw new BadRequestError("One or more question IDs are invalid");
  }

  // ── 10. Validate option ownership ─────────────────────────────────────────
  const validOptions = await validateOptionOwnershipRepository(pollId, data.answers);
  const validPairs = new Set(validOptions.map((o) => `${o.questionId}:${o.id}`));

  for (const [questionId, optionId] of Object.entries(data.answers)) {
    if (!validPairs.has(`${questionId}:${optionId}`)) {
      throw new BadRequestError(
        `Option ${optionId} does not belong to question ${questionId}`
      );
    }
  }

  // ── 11. Cast vote in transaction ──────────────────────────────────────────
  const response = await castVoteRepository(pollId, data.answers, userId, anonymousId);

  // ── 12. Emit real-time update to all poll watchers ────────────────────────
  // Fire and forget — don't await, never block the vote response
  emitVoteUpdate(pollId);

  return {
    responseId: response.id,
    message: "Vote cast successfully",
  };
}
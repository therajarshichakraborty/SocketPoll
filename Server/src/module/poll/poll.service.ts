import {
  createPollRepository,
  deletePollRepository,
  getPollByIdRepository,
  getPollOwnerRepository,
  getPollsByCreatorRepository,
  updatePollRepository,
} from "./poll.repository";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../common/utils/api.error";
import { CreatePollDTO, PollQueryDTO, UpdatePollDTO } from "./poll.dto";

export async function createPollService(creatorId: string, data: CreatePollDTO) {
  if (data.expiresAt && new Date(data.expiresAt) <= new Date()) {
    throw new BadRequestError("Expiry date must be in the future");
  }

  const questionTexts = data.questions.map((q) => q.question.toLowerCase());
  if (new Set(questionTexts).size !== questionTexts.length) {
    throw new BadRequestError("Duplicate questions are not allowed");
  }

  const poll = await createPollRepository(creatorId, data);
  return poll;
}

export async function getPollService(pollId: string, requesterId?: string) {
  const poll = await getPollByIdRepository(pollId);

  if (!poll) throw new NotFoundError("Poll");

  if (!poll.isPublished && poll.creatorId !== requesterId) {
    throw new ForbiddenError("This poll is not published yet");
  }

  return poll;
}

export async function getMyPollsService(creatorId: string, query: PollQueryDTO) {
  return getPollsByCreatorRepository(creatorId, query);
}

export async function updatePollService(pollId: string, requesterId: string, data: UpdatePollDTO) {
  const poll = await getPollOwnerRepository(pollId);

  if (!poll) throw new NotFoundError("Poll");
  if (poll.creatorId !== requesterId) throw new ForbiddenError();

  if (poll.isClosed) throw new BadRequestError("Cannot update a closed poll");

  if (poll.isPublished && (data.isAnonymous !== undefined || data.requireAuth !== undefined)) {
    throw new BadRequestError("Cannot change anonymity or auth settings after publishing");
  }

  return updatePollRepository(pollId, {
    ...(data.title && { title: data.title }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.isAnonymous !== undefined && { isAnonymous: data.isAnonymous }),
    ...(data.requireAuth !== undefined && { requireAuth: data.requireAuth }),
    ...(data.expiresAt !== undefined && {
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    }),
  });
}

export async function publishPollService(pollId: string, requesterId: string) {
  const poll = await getPollByIdRepository(pollId);
  if (!poll) throw new NotFoundError("Poll");
  if (poll.creatorId !== requesterId) throw new ForbiddenError();
  if (poll.isPublished) throw new BadRequestError("Poll is already published");
  if (poll.isClosed) throw new BadRequestError("Cannot publish a closed poll");

  if (!poll.questions || poll.questions.length === 0) {
    throw new BadRequestError("Add at least one question before publishing");
  }
  for (const q of poll.questions) {
    if (!q.options || q.options.length < 2) {
      throw new BadRequestError(`Question "${q.question}" needs at least 2 options`);
    }
  }

  return updatePollRepository(pollId, { isPublished: true });
}

export async function closePollService(pollId: string, requesterId: string) {
  const poll = await getPollOwnerRepository(pollId);
  if (!poll) throw new NotFoundError("Poll");
  if (poll.creatorId !== requesterId) throw new ForbiddenError();
  if (poll.isClosed) throw new BadRequestError("Poll is already closed");

  return updatePollRepository(pollId, { isClosed: true });
}

export async function reopenPollService(pollId: string, requesterId: string) {
  const poll = await getPollOwnerRepository(pollId);
  if (!poll) throw new NotFoundError("Poll");
  if (poll.creatorId !== requesterId) throw new ForbiddenError();
  if (!poll.isClosed) throw new BadRequestError("Poll is not closed");

  const full = await getPollByIdRepository(pollId);
  if (full?.expiresAt && full.expiresAt < new Date()) {
    throw new BadRequestError("Cannot reopen poll — expiry date has passed. Update expiry first.");
  }

  return updatePollRepository(pollId, { isClosed: false });
}

export async function deletePollService(pollId: string, requesterId: string) {
  const poll = await getPollOwnerRepository(pollId);
  if (!poll) throw new NotFoundError("Poll");
  if (poll.creatorId !== requesterId) throw new ForbiddenError();

  if (poll.isPublished && !poll.isClosed) {
    throw new BadRequestError("Close the poll before deleting it");
  }

  await deletePollRepository(pollId);
}

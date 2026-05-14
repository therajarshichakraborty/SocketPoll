import { eq, and, inArray, sql } from "drizzle-orm";
import { db } from "../../common/config/db.config";
import { responses } from "../../database/schema/response.schema";
import { responseAnswers } from "../../database/schema/response-answer.schema";
import { options } from "../../database/schema/option.schema";
import { questions } from "../../database/schema/question.schema";

// ── Check if user already voted ───────────────────────────────────────────────

export async function findExistingResponseRepository(
  pollId: string,
  userId?: string,
  anonymousId?: string,
) {
  if (userId) {
    return db.query.responses.findFirst({
      where: and(eq(responses.pollId, pollId), eq(responses.userId, userId)),
    });
  }

  if (anonymousId) {
    return db.query.responses.findFirst({
      where: and(eq(responses.pollId, pollId), eq(responses.anonymousId, anonymousId)),
    });
  }

  return null;
}

// ── Validate options belong to the correct questions ──────────────────────────

export async function validateOptionOwnershipRepository(
  pollId: string,
  answers: Record<string, string>, // questionId → optionId
) {
  const questionIds = Object.keys(answers);
  const optionIds = Object.values(answers);

  // Fetch all matching options that belong to this poll's questions
  const validOptions = await db
    .select({
      id: options.id,
      questionId: options.questionId,
    })
    .from(options)
    .innerJoin(questions, eq(options.questionId, questions.id))
    .where(
      and(
        eq(questions.pollId, pollId),
        inArray(options.id, optionIds),
        inArray(questions.id, questionIds),
      ),
    );

  return validOptions;
}

// ── Cast vote in a transaction ────────────────────────────────────────────────

export async function castVoteRepository(
  pollId: string,
  answers: Record<string, string>, // questionId → optionId
  userId?: string,
  anonymousId?: string,
) {
  return db.transaction(async (tx) => {
    // 1. Create response record
    const [response] = await tx
      .insert(responses)
      .values({
        pollId,
        userId: userId ?? null,
        anonymousId: anonymousId ?? null,
      })
      .returning();

    // 2. Create response_answers for each question → option pair
    const answerRows = Object.entries(answers).map(([questionId, optionId]) => ({
      responseId: response.id,
      questionId,
      optionId,
    }));

    await tx.insert(responseAnswers).values(answerRows);

    // 3. Increment vote counts atomically on each selected option
    const optionIds = Object.values(answers);
    await tx
      .update(options)
      .set({ votes: sql`${options.votes} + 1` })
      .where(inArray(options.id, optionIds));

    return response;
  });
}

// ── Get required questions for a poll ─────────────────────────────────────────

export async function getRequiredQuestionsRepository(pollId: string) {
  return db.query.questions.findMany({
    where: and(eq(questions.pollId, pollId), eq(questions.isRequired, true)),
    columns: { id: true, question: true, isRequired: true },
  });
}

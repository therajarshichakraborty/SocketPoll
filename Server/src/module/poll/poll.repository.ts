import { eq, desc, and, count } from "drizzle-orm";
import { db } from "../../common/config/db.config";
import { polls } from "../../database/schema/poll.schema";
import { questions } from "../../database/schema/question.schema";
import { options } from "../../database/schema/option.schema";
import { CreatePollDTO, PollQueryDTO } from "./poll.dto";

export async function createPollRepository(creatorId: string, data: CreatePollDTO) {
  return db.transaction(async (tx) => {
    const [poll] = await tx
      .insert(polls)
      .values({
        creatorId,
        title: data.title,
        description: data.description ?? null,
        isAnonymous: data.isAnonymous ?? true,
        requireAuth: data.requireAuth ?? false,
        isPublished: false,
        isClosed: false,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      })
      .returning();

    for (const q of data.questions) {
      const [question] = await tx
        .insert(questions)
        .values({
          pollId: poll.id,
          question: q.question,
          isRequired: q.isRequired ?? true,
          order: q.order,
        })
        .returning();

      if (q.options.length > 0) {
        await tx.insert(options).values(
          q.options.map((opt) => ({
            questionId: question.id,
            text: opt.text,
            votes: 0,
            order: opt.order,
          })),
        );
      }
    }

    return poll;
  });
}

export async function getPollByIdRepository(pollId: string) {
  return db.query.polls.findFirst({
    where: eq(polls.id, pollId),
    with: {
      questions: {
        orderBy: (q: any, { asc }: any) => [asc(q.order)],
        with: {
          options: {
            orderBy: (o: any, { asc }: any) => [asc(o.order)],
          },
        },
      },
    },
  });
}

export async function getPollsByCreatorRepository(creatorId: string, query: PollQueryDTO) {
  const { page = 1, limit = 10, published, closed } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(polls.creatorId, creatorId)];
  if (published !== undefined) conditions.push(eq(polls.isPublished, published));
  if (closed !== undefined) conditions.push(eq(polls.isClosed, closed));

  const [rows, [{ total }]] = await Promise.all([
    db.query.polls.findMany({
      where: and(...conditions),
      orderBy: [desc(polls.createdAt)],
      limit,
      offset,
      with: {
        questions: { columns: { id: true } }, // just count
      },
    }),
    db
      .select({ total: count() })
      .from(polls)
      .where(and(...conditions)),
  ]);

  return { rows, total: Number(total), page, limit };
}

export async function updatePollRepository(
  pollId: string,
  data: Partial<{
    title: string;
    description: string;
    isAnonymous: boolean;
    requireAuth: boolean;
    expiresAt: Date | null;
    isPublished: boolean;
    isClosed: boolean;
    updatedAt: Date;
  }>,
) {
  const [updated] = await db
    .update(polls)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(polls.id, pollId))
    .returning();

  return updated;
}

export async function deletePollRepository(pollId: string) {
  await db.delete(polls).where(eq(polls.id, pollId));
}

export async function getPollOwnerRepository(pollId: string) {
  return db.query.polls.findFirst({
    where: eq(polls.id, pollId),
    columns: { id: true, creatorId: true, isClosed: true, isPublished: true },
  });
}

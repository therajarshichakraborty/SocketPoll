import { eq, count, sql } from "drizzle-orm";
import { db } from "../../common/config/db.config";
import { responses } from "../../database/schema/response.schema";
import { responseAnswers } from "../../database/schema/response-answer.schema";
import { options } from "../../database/schema/option.schema";
import { questions } from "../../database/schema/question.schema";
import { polls } from "../../database/schema/poll.schema";

// ── Total vote count for a poll ───────────────────────────────────────────────

export async function getTotalVotesRepository(pollId: string) {
  const [result] = await db
    .select({ total: count() })
    .from(responses)
    .where(eq(responses.pollId, pollId));

  return Number(result?.total ?? 0);
}

// ── Per-option vote counts + percentages for every question in a poll ─────────

export async function getPollResultsRepository(pollId: string) {
  // Get all questions with options and their vote counts
  const questionRows = await db.query.questions.findMany({
    where: eq(questions.pollId, pollId),
    orderBy: (q: any, { asc }: any) => [asc(q.order)],
    with: {
      options: {
        orderBy: (o: any, { asc }: any) => [asc(o.order)],
        columns: { id: true, text: true, votes: true, order: true },
      },
    },
  });

  const totalResponses = await getTotalVotesRepository(pollId);

  return questionRows.map((q: any) => {
    const questionTotal = q.options.reduce((sum: any, o: any) => sum + o.votes, 0);

    return {
      questionId: q.id,
      question: q.question,
      order: q.order,
      totalAnswers: questionTotal,
      options: q.options.map((o: any) => ({
        optionId: o.id,
        text: o.text,
        votes: o.votes,
        percentage: questionTotal > 0 ? Math.round((o.votes / questionTotal) * 100) : 0,
      })),
    };
  });
}

// ── Vote activity over time (daily buckets) ───────────────────────────────────

export async function getVoteTimelineRepository(pollId: string) {
  const rows = await db
    .select({
      date: sql<string>`DATE(${responses.createdAt})`.as("date"),
      votes: count(),
    })
    .from(responses)
    .where(eq(responses.pollId, pollId))
    .groupBy(sql`DATE(${responses.createdAt})`)
    .orderBy(sql`DATE(${responses.createdAt})`);

  return rows;
}

// ── Trending polls (sorted by recent vote activity) ───────────────────────────

export async function getTrendingPollsRepository(limit = 10) {
  // Score = votes in last 24h * 5 + total votes * 1
  // We approximate using a join on responses
  const rows = await db
    .select({
      pollId: responses.pollId,
      recentVotes: count(),
    })
    .from(responses)
    .where(sql`${responses.createdAt} > NOW() - INTERVAL '24 hours'`)
    .groupBy(responses.pollId)
    .orderBy(sql`count(*) DESC`)
    .limit(limit);

  if (rows.length === 0) return [];

  const pollIds = rows.map((r) => r.pollId);

  const pollRows = await db.query.polls.findMany({
    where: (p: any, { inArray }: any) => inArray(p.id, pollIds),
    columns: {
      id: true,
      title: true,
      description: true,
      isPublished: true,
      isClosed: true,
      createdAt: true,
    },
  });

  // Merge score into poll data
  const scoreMap = new Map(rows.map((r) => [r.pollId, Number(r.recentVotes)]));

  return pollRows
    .filter((p: any) => p.isPublished && !p.isClosed)
    .map((p: any) => ({
      ...p,
      recentVotes: scoreMap.get(p.id) ?? 0,
    }))
    .sort((a: any, b: any) => b.recentVotes - a.recentVotes);
}

// ── Summary stats for creator dashboard ──────────────────────────────────────

export async function getPollSummaryRepository(pollId: string) {
  const [totalVotes, results] = await Promise.all([
    getTotalVotesRepository(pollId),
    getPollResultsRepository(pollId),
  ]);

  return { totalVotes, results };
}

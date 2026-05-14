import { getIO } from "../../websockets/socket";
import { getPollResultsRepository } from "../../module/analytics/analytics.repository";

// ── Emit live vote update to all clients watching this poll ───────────────────
// Called from vote.service.ts after a successful vote

export async function emitVoteUpdate(pollId: string) {
  try {
    const io = getIO();
    const room = `poll:${pollId}`;

    // Fetch latest results fresh from DB
    const results = await getPollResultsRepository(pollId);

    // Count total votes from results
    const totalVotes = results.reduce((sum, q) => sum + q.totalAnswers, 0);

    // Broadcast to everyone in the poll room
    io.to(room).emit("vote_update", {
      pollId,
      totalVotes,
      results,
    });
  } catch (err) {
    // Never crash the vote flow if socket emit fails
    console.error("[socket] emitVoteUpdate failed:", err);
  }
}

// ── Emit poll closed event ────────────────────────────────────────────────────

export function emitPollClosed(pollId: string) {
  try {
    const io = getIO();
    io.to(`poll:${pollId}`).emit("poll_closed", { pollId });
  } catch (err) {
    console.error("[socket] emitPollClosed failed:", err);
  }
}

// ── Emit poll published event ─────────────────────────────────────────────────

export function emitPollPublished(pollId: string) {
  try {
    const io = getIO();
    io.to(`poll:${pollId}`).emit("poll_published", { pollId });
  } catch (err) {
    console.error("[socket] emitPollPublished failed:", err);
  }
}
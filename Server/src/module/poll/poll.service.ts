import type {
  Poll,
  PollOption,
  PollState,
  Student,
  Vote,
  CreatePollPayload,
} from "../../types/index";
import { generateRoomId, generateOptionId } from "../utils/index.js";

const store = new Map<string, PollState>();

export function createPoll(payload: CreatePollPayload): { roomId: string; poll: Poll } {
  const roomId = generateRoomId();
  const now = Date.now();

  const options: PollOption[] = payload.options.map((text) => ({
    id: generateOptionId(),
    text,
    votes: 0,
    percentage: 0,
  }));

  const poll: Poll = {
    id: roomId,
    question: payload.question,
    options,
    timerSeconds: payload.timerSeconds,
    createdAt: now,
    endsAt: now + payload.timerSeconds * 1000,
    isActive: true,
    totalVotes: 0,
  };

  const state: PollState = {
    poll,
    students: new Map(),
    votes: new Map(),
    timerId: null,
  };

  store.set(roomId, state);
  return { roomId, poll };
}

export function getPollState(roomId: string): PollState | undefined {
  return store.get(roomId);
}

export function closePoll(roomId: string): Poll | null {
  const state = store.get(roomId);
  if (!state) return null;

  state.poll.isActive = false;

  if (state.timerId !== null) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }

  return state.poll;
}

export function setTimerId(
  roomId: string,
  timerId: ReturnType<typeof setTimeout>
): void {
  const state = store.get(roomId);
  if (state) state.timerId = timerId;
}

export type VoteResult =
  | { ok: true; poll: Poll }
  | { ok: false; reason: string };

export function recordVote(
  roomId: string,
  socketId: string,
  optionId: string
): VoteResult {
  const state = store.get(roomId);

  if (!state) return { ok: false, reason: "Room not found." };
  if (!state.poll.isActive) return { ok: false, reason: "Poll is no longer active." };
  if (state.votes.has(socketId)) return { ok: false, reason: "You have already voted." };

  const option = state.poll.options.find((o) => o.id === optionId);
  if (!option) return { ok: false, reason: "Invalid option." };

  option.votes += 1;
  state.poll.totalVotes += 1;
  state.votes.set(socketId, {
    studentSocketId: socketId,
    pollId: roomId,
    optionId,
    timestamp: Date.now(),
  });

  const student = state.students.get(socketId);
  if (student) {
    student.hasVoted = true;
    student.votedOptionId = optionId;
  }

  const total = state.poll.totalVotes;
  state.poll.options.forEach((o) => {
    o.percentage = Math.round((o.votes / total) * 100);
  });

  return { ok: true, poll: state.poll };
}

export function addStudent(roomId: string, student: Student): boolean {
  const state = store.get(roomId);
  if (!state) return false;
  state.students.set(student.socketId, student);
  return true;
}

export function removeStudent(socketId: string): { roomId: string; student: Student } | null {
  for (const [roomId, state] of store.entries()) {
    const student = state.students.get(socketId);
    if (student) {
      state.students.delete(socketId);
      return { roomId, student };
    }
  }
  return null;
}

export function getStudentCount(roomId: string): number {
  return store.get(roomId)?.students.size ?? 0;
}

export function cleanupRoom(roomId: string): void {
  const state = store.get(roomId);
  if (!state) return;
  if (state.timerId !== null) clearTimeout(state.timerId);
  store.delete(roomId);
}
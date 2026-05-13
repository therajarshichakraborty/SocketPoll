import type { Server, Socket } from "socket.io";
import type {
  CreatePollPayload,
  JoinPayload,
  SubmitVotePayload,
  NewQuestionPayload,
  PollUpdatePayload,
  PollResultsPayload,
  StudentJoinedPayload,
  StudentLeftPayload,
} from "../../types/index.ts"
import * as PollService from "../poll/poll.service.js";

export function registerPollHandlers(io: Server, socket: Socket): void {

  socket.on("create-poll", (payload: CreatePollPayload) => {
    if (!payload.question?.trim()) {
      socket.emit("error", { message: "Question is required." });
      return;
    }
    if (!Array.isArray(payload.options) || payload.options.length < 2) {
      socket.emit("error", { message: "At least 2 options are required." });
      return;
    }
    if (!payload.timerSeconds || payload.timerSeconds < 5) {
      socket.emit("error", { message: "Timer must be at least 5 seconds." });
      return;
    }

    const { roomId, poll } = PollService.createPoll(payload);

    socket.join(roomId);

    socket.emit("poll-created", { roomId, poll });

    const newQuestionPayload: NewQuestionPayload = { poll, endsAt: poll.endsAt };
    io.to(roomId).emit("new-question", newQuestionPayload);

    const timerId = setTimeout(() => {
      const closedPoll = PollService.closePoll(roomId);
      if (!closedPoll) return;

      const resultsPayload: PollResultsPayload = {
        poll: closedPoll,
        finalResults: closedPoll.options,
      };

      io.to(roomId).emit("poll-results", resultsPayload);
    }, payload.timerSeconds * 1000);

    PollService.setTimerId(roomId, timerId);

    console.log(`[Poll] Created room ${roomId} | Q: "${payload.question}" | Timer: ${payload.timerSeconds}s`);
  });

  socket.on("join", (payload: JoinPayload) => {
    const { name, roomId } = payload;

    if (!name?.trim()) {
      socket.emit("error", { message: "Name is required." });
      return;
    }
    if (!roomId?.trim()) {
      socket.emit("error", { message: "Room ID is required." });
      return;
    }

    const state = PollService.getPollState(roomId);
    if (!state) {
      socket.emit("error", { message: "Room not found. Check the Room ID." });
      return;
    }

    const added = PollService.addStudent(roomId, {
      socketId: socket.id,
      name: name.trim(),
      roomId,
      hasVoted: false,
      votedOptionId: null,
      joinedAt: Date.now(),
    });

    if (!added) {
      socket.emit("error", { message: "Could not join room." });
      return;
    }

    socket.join(roomId);

    socket.emit("joined", { poll: state.poll, endsAt: state.poll.endsAt });

    const joinedPayload: StudentJoinedPayload = {
      student: { name: name.trim(), roomId, hasVoted: false, votedOptionId: null, joinedAt: Date.now() },
      totalStudents: PollService.getStudentCount(roomId),
    };
    io.to(roomId).emit("student-joined", joinedPayload);

    console.log(`[Join] ${name} joined room ${roomId}`);
  });

  socket.on("submit-vote", (payload: SubmitVotePayload) => {
    const { roomId, optionId } = payload;

    const result = PollService.recordVote(roomId, socket.id, optionId);

    if (!result.ok) {
      socket.emit("error", { message: result.reason });
      return;
    }

    const updatePayload: PollUpdatePayload = { poll: result.poll };
    io.to(roomId).emit("poll-update", updatePayload);

    console.log(`[Vote] Socket ${socket.id} voted option ${optionId} in room ${roomId}`);
  });

  socket.on("disconnect", () => {
    const removed = PollService.removeStudent(socket.id);
    if (!removed) return;

    const { roomId, student } = removed;

    const leftPayload: StudentLeftPayload = {
      name: student.name,
      totalStudents: PollService.getStudentCount(roomId),
    };

    io.to(roomId).emit("student-left", leftPayload);

    console.log(`[Leave] ${student.name} left room ${roomId}`);
  });
}
import { Server as HttpServer } from "node:http";
import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../common/config/env.config";
import logger from "../common/config/logger.config";

let io: SocketServer;

// ── Initialize Socket.io ──────────────────────────────────────────────────────

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: "https://socket-poll.vercel.app",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
          id: string;
          email: string;
        };
        socket.data.user = payload;
      } catch {
        // invalid token — treat as anonymous
      }
    }
    next();
  });

  // ── Connection handler ────────────────────────────────────────────────────
  io.on("connection", (socket: Socket) => {
    const userId = socket.data.user?.id ?? "anonymous";
    logger.info(`[socket] connected: ${socket.id} user: ${userId}`);

    // ── Join a poll room ───────────────────────────────────────────────────
    // Client emits: { pollId: "uuid" }
    // Server puts socket in room "poll:POLL_ID"
    socket.on("join_poll", (pollId: string) => {
      if (!pollId || typeof pollId !== "string") return;
      const room = `poll:${pollId}`;
      socket.join(room);
      logger.info(`[socket] ${socket.id} joined room ${room}`);
      socket.emit("joined_poll", { pollId, room });
    });

    // ── Leave a poll room ──────────────────────────────────────────────────
    socket.on("leave_poll", (pollId: string) => {
      const room = `poll:${pollId}`;
      socket.leave(room);
      logger.info(`[socket] ${socket.id} left room ${room}`);
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      logger.info(`[socket] disconnected: ${socket.id} reason: ${reason}`);
    });
  });

  logger.info("[socket] Socket.io initialized");
  return io;
}

// ── Get io instance (used by vote service to emit events) ────────────────────

export function getIO(): SocketServer {
  if (!io) throw new Error("Socket.io not initialized. Call initSocket first.");
  return io;
}
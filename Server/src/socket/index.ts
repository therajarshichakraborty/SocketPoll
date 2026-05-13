import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { registerPollHandlers } from "../module/poll/poll.controller";

export function initSockets(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);
    registerPollHandlers(io, socket);
  });

  return io;
}
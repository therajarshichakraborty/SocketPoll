import express, { Application, Request, Response, NextFunction, json, urlencoded } from "express";
import { requestLogger } from "./common/middleware/logger.middleware";
import cookieParser from "cookie-parser";
import logger from "./common/config/logger.config";
import pollRoutes from "./module/poll/poll.route";
import voteRoutes from "./module/vote/vote.route";
import analyticsRoutes from "./module/analytics/analytics.route";
import { errorHandler } from "./common/utils/errorHandler";
import authRoute from "./module/auth/auth.route";
import cors from "cors";
import { env } from "./common/config/env.config";

export function createApp(): Application {
  const app: Application = express();

  app.use(json({ limit: "10kb" }));
  app.use(urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(requestLogger);

  app.use(cors({
    origin: "https://socket-poll.vercel.app",   
    credentials: true,                 
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));

  // ── Health check ──────────────────────────────────────────────
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      ts: Date.now(),
      name: "My name is Rajarshi Chakraborty",
    });
  });

  // ── Routes ────────────────────────────────────────────────────
  app.use("/api/auth", authRoute);
  app.use("/api/polls", pollRoutes);
  app.use("/api/polls/:pollId/vote", voteRoutes);
  app.use("/api/polls", analyticsRoutes);
  app.use("/api/analytics", analyticsRoutes);

  // ── 404 handler ───────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: "this route is not found ,please try something else",
    });
  });

  // ── Error handler MUST be last ────────────────────────────────
  app.use(errorHandler);

  return app;
}
import express, { Application, Request, Response, NextFunction, json, urlencoded } from "express";
import { requestLogger } from "./common/middleware/logger.middleware";
import cookieParser from "cookie-parser";
import logger from "./common/config/logger.config";

export function createApp(): Application {
  const app: Application = express();

  app.use(json({ limit: "10kb" }));
  app.use(urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(requestLogger);

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", ts: Date.now(), name: "My name is Rajarshi Chakraborty" });
  });

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: "Not found" });
  });
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error("[app] Unhandled error:", err);
    res.status(500).json({ message: "Internal server error" });
  });

  app.all("{*path}", (_req: Request, res: Response) => {
    res.json({
      status: "not ok",
      name: "undefined server route",
    });
  });

  return app;
}

import {createServer} from "node:http";
import { createApp } from "./app";
import { env } from "./common/config/env.config";
import { redis } from "./common/config/redis.config";
import logger from "./common/config/logger.config";
import { initGoogleProvider } from "./common/auth/providers/google.provider";

async function main():Promise<void> {
  logger.info("Initializing Google OIDC provider...");
  await initGoogleProvider();

  logger.info("Google OIDC provider initialized")
  await redis.ping();

  logger.info("Redis connected");
  const app = createApp();
  const server = createServer(app);

  server.listen(env.PORT, () => {
    logger.info(`Server running on port http://localhost:${env.PORT}`);
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down...`);
    server.close(async () => {
      await redis.quit();
      logger.info("Redis disconnected");
      logger.info("HTTP server closed");

      process.exit(0);
    });
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
}

main().catch((error) => {
  logger.error("Application startup failed", error);
  process.exit(1);
});

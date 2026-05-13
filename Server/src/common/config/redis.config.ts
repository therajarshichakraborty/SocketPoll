import Redis from "ioredis";
import { env } from "./env.config";
import logger from "./logger.config";

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (_redis) return _redis;

  _redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,          
    retryStrategy(times) {
      if (times > 10) return null; 
      return Math.min(times * 200, 3_000);
    },
  });

  _redis.on("error", (err) => {
    logger.error("[Redis] connection error:", err.message);
  });

  _redis.on("ready", () => {
    logger.info("[Redis] connected");
  });

  return _redis;
}
export const redis = getRedis();
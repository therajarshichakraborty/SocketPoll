import Redis from "ioredis";
import { env } from "./env.config";

export const redis = new Redis(
	env.REDIS_URL!
);
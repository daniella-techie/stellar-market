import type { PrismaClient } from "@prisma/client";
import RedisClient from "./redis";
import { logger } from "./logger";
import { getHorizonListenerHealth } from "../services/horizon-listener.service";

export type DependencyHealthStatus = "ok" | "error";
export type HorizonListenerStatus = "connected" | "degraded" | "down";

export type HealthResponse = {
  status: "ok" | "degraded";
  service: "stellarmarket-api";
  checks: {
    database: DependencyHealthStatus;
    redis: DependencyHealthStatus;
    horizonListener: HorizonListenerStatus;
  };
};

export async function getHealthStatus(
  prisma: Pick<PrismaClient, "$queryRawUnsafe">,
): Promise<HealthResponse> {
  const checks: HealthResponse["checks"] = {
    database: "ok",
    redis: "ok",
    horizonListener: getHorizonListenerHealth(),
  };

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
  } catch (error) {
    checks.database = "error";
    logger.error({ err: error }, "Health check database probe failed");
  }

  try {
    if (!RedisClient.isRedisConnected()) {
      await RedisClient.connect();
    }
    await RedisClient.getInstance().ping();
  } catch (error) {
    checks.redis = "error";
    logger.error({ err: error }, "Health check Redis probe failed");
  }

  const healthy =
    checks.database === "ok" &&
    checks.redis === "ok" &&
    checks.horizonListener !== "down";

  return {
    status: healthy ? "ok" : "degraded",
    service: "stellarmarket-api",
    checks,
  };
}

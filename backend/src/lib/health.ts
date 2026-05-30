import type { PrismaClient } from "@prisma/client";
import RedisClient from "./redis";
import { logger } from "./logger";
import { getHorizonListenerHealth } from "../services/horizon-listener.service";

export type DependencyHealthStatus = "ok" | "error" | "degraded";
export type HorizonListenerStatus = "connected" | "degraded" | "down";

export type HealthResponse = {
  status: "ok" | "degraded";
  service: "stellarmarket-api";
  uptime: number;
  checks: {
    database: DependencyHealthStatus;
    redis: DependencyHealthStatus;
    horizonListener: DependencyHealthStatus;
  };
};

let horizonListenerHealthy = true;

export function setHorizonListenerHealth(healthy: boolean): void {
  horizonListenerHealthy = healthy;
}

export async function getHealthStatus(
  prisma: Pick<PrismaClient, "$queryRawUnsafe">,
): Promise<HealthResponse> {
  const checks: HealthResponse["checks"] = {
    database: "ok",
    redis: "ok",
    horizonListener: horizonListenerHealthy ? "ok" : "degraded",
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

  // Database and Redis are critical; Horizon listener is non-critical (degraded only)
  const criticalHealthy =
    checks.database === "ok" && checks.redis === "ok";

  return {
    status: criticalHealthy ? "ok" : "degraded",
    service: "stellarmarket-api",
    uptime: Math.floor(process.uptime()),
    checks,
  };
}

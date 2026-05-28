import { getHealthStatus } from "../health";

const connectMock = jest.fn();
const pingMock = jest.fn();
const isRedisConnectedMock = jest.fn();
const getHorizonListenerHealthMock = jest.fn();

jest.mock("../redis", () => ({
  __esModule: true,
  default: {
    connect: (...args: unknown[]) => connectMock(...args),
    getInstance: () => ({ ping: (...args: unknown[]) => pingMock(...args) }),
    isRedisConnected: () => isRedisConnectedMock(),
  },
}));

jest.mock("../../services/horizon-listener.service", () => ({
  getHorizonListenerHealth: () => getHorizonListenerHealthMock(),
}));

describe("getHealthStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns ok when database, redis, and horizonListener are all healthy", async () => {
    isRedisConnectedMock.mockReturnValue(true);
    pingMock.mockResolvedValue("PONG");
    getHorizonListenerHealthMock.mockReturnValue("connected");
    const prisma = {
      $queryRawUnsafe: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
    };

    const result = await getHealthStatus(prisma as any);

    expect(result).toEqual({
      status: "ok",
      service: "stellarmarket-api",
      checks: {
        database: "ok",
        redis: "ok",
        horizonListener: "connected",
      },
    });
  });

  it("returns degraded when a dependency probe fails", async () => {
    isRedisConnectedMock.mockReturnValue(false);
    connectMock.mockRejectedValue(new Error("redis down"));
    getHorizonListenerHealthMock.mockReturnValue("connected");
    const prisma = {
      $queryRawUnsafe: jest.fn().mockRejectedValue(new Error("db down")),
    };

    const result = await getHealthStatus(prisma as any);

    expect(result.status).toBe("degraded");
    expect(result.checks.database).toBe("error");
    expect(result.checks.redis).toBe("error");
  });

  it("returns degraded when horizonListener is 'down'", async () => {
    isRedisConnectedMock.mockReturnValue(true);
    pingMock.mockResolvedValue("PONG");
    getHorizonListenerHealthMock.mockReturnValue("down");
    const prisma = {
      $queryRawUnsafe: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
    };

    const result = await getHealthStatus(prisma as any);

    expect(result.status).toBe("degraded");
    expect(result.checks.horizonListener).toBe("down");
  });

  it("returns ok when horizonListener is 'degraded' (HALF_OPEN)", async () => {
    isRedisConnectedMock.mockReturnValue(true);
    pingMock.mockResolvedValue("PONG");
    getHorizonListenerHealthMock.mockReturnValue("degraded");
    const prisma = {
      $queryRawUnsafe: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
    };

    const result = await getHealthStatus(prisma as any);

    // degraded listener is not "down" so overall status is ok
    expect(result.status).toBe("ok");
    expect(result.checks.horizonListener).toBe("degraded");
  });
});

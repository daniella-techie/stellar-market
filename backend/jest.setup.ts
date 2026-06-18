// Jest setup file — intentionally minimal

// Prevent Redis TCP connections during tests.
//
// auth.2fa.test.ts (and other auth tests) import auth.routes.ts which imports
// rate-limit.ts which calls getRedisClient() at module level. getRedisClient()
// launches a real ioredis connection that retries with delays (200ms, 400ms,
// 800ms). Those deferred retry rejections fire during later test files and
// jest catches them as blank-error failures in whatever test happens to be
// running at that moment (e.g. transaction.routes.test.ts).
//
// Returning null here makes every rate-limiter fall back to MemoryStore and
// stops any TCP connection from being opened during the test run.
jest.mock("./src/config/redis", () => ({
  getRedisClient: jest.fn().mockReturnValue(null),
  RECOMMENDATION_CACHE_PREFIX: "recommendations:",
  RECOMMENDATION_CACHE_TTL: 600,
}));

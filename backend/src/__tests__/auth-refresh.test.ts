import crypto from "crypto";

// ─── Prisma mock ────────────────────────────────────────────────────────────
const mockRefreshToken = {
  create: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
};
const mockUser = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => ({
    refreshToken: mockRefreshToken,
    user: mockUser,
    $disconnect: jest.fn(),
  })),
}));

jest.mock("../config", () => ({
  config: {
    jwtSecret: "test-secret",
    frontendUrl: "http://localhost:3000",
  },
}));

jest.mock("../utils/email", () => ({
  sendPasswordResetEmail: jest.fn(),
  sendVerificationEmail: jest.fn(),
}));

jest.mock("../lib/logger", () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
  installRequestIdConsolePatch: jest.fn(),
}));

jest.mock("../lib/redis", () => ({ redis: null }));

import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import jwt from "jsonwebtoken";
import authRouter from "../routes/auth.routes";

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/auth", authRouter);
  return app;
}

describe("POST /auth/refresh", () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 401 when no cookie is set", async () => {
    const res = await request(app).post("/auth/refresh");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/missing/i);
  });

  test("returns 401 for a revoked token", async () => {
    const raw = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(raw);

    mockRefreshToken.findUnique.mockResolvedValue({
      tokenHash,
      userId: "user-1",
      revoked: true,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const res = await request(app)
      .post("/auth/refresh")
      .set("Cookie", `refreshToken=${raw}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  test("returns 401 for an expired token", async () => {
    const raw = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(raw);

    mockRefreshToken.findUnique.mockResolvedValue({
      tokenHash,
      userId: "user-1",
      revoked: false,
      expiresAt: new Date(Date.now() - 1000),
    });

    const res = await request(app)
      .post("/auth/refresh")
      .set("Cookie", `refreshToken=${raw}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  test("issues a new access token for a valid refresh token", async () => {
    const raw = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(raw);

    mockRefreshToken.findUnique.mockResolvedValue({
      tokenHash,
      userId: "user-1",
      revoked: false,
      expiresAt: new Date(Date.now() + 60_000),
    });
    mockUser.findUnique.mockResolvedValue({ id: "user-1", isSuspended: false });

    const res = await request(app)
      .post("/auth/refresh")
      .set("Cookie", `refreshToken=${raw}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");

    const decoded = jwt.verify(res.body.token, "test-secret") as { userId: string };
    expect(decoded.userId).toBe("user-1");
  });
});

describe("POST /auth/logout", () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("succeeds even without a cookie", async () => {
    const res = await request(app).post("/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });

  test("revokes the stored refresh token", async () => {
    const raw = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(raw);

    mockRefreshToken.update.mockResolvedValue({});

    const res = await request(app)
      .post("/auth/logout")
      .set("Cookie", `refreshToken=${raw}`);

    expect(res.status).toBe(200);
    expect(mockRefreshToken.update).toHaveBeenCalledWith({
      where: { tokenHash },
      data: { revoked: true },
    });
  });

  test("clears the refreshToken cookie", async () => {
    const raw = crypto.randomBytes(32).toString("hex");
    mockRefreshToken.update.mockResolvedValue({});

    const res = await request(app)
      .post("/auth/logout")
      .set("Cookie", `refreshToken=${raw}`);

    const setCookie = res.headers["set-cookie"] as string[] | string;
    const cookieStr = Array.isArray(setCookie) ? setCookie.join("; ") : String(setCookie ?? "");
    expect(cookieStr).toMatch(/refreshToken=;/i);
  });
});

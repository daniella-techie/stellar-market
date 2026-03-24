import { Request, Response } from "express";
import rateLimit from "express-rate-limit";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
type RateLimitedRequest = Request & { rateLimit?: { resetTime?: Date } };

const sendTooManyRequests = (req: RateLimitedRequest, res: Response): void => {
  const resetTime = req.rateLimit?.resetTime;
  const retryAfterSeconds = resetTime
    ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
    : Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);

  res.setHeader("Retry-After", retryAfterSeconds.toString());
  res.status(429).json({ error: "Too many requests" });
};

export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: sendTooManyRequests,
});

export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: sendTooManyRequests,
});

export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith("/auth/"),
  handler: sendTooManyRequests,
});

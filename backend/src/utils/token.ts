import crypto from "crypto";

/** Generate a cryptographically random hex token. */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** Hash a token using SHA-256 so only the hash is stored in the DB. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

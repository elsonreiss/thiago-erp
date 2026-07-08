import { randomBytes } from "node:crypto";

export const SESSION_COOKIE_NAME = "thiago_session";
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function sessionExpiryDate(): Date {
  return new Date(Date.now() + SESSION_DURATION_MS);
}

import jwt from "jsonwebtoken";

const JWT_SECRET = () => process.env.JWT_SECRET || "dev-secret-change-me";

export interface AuthPayload {
  userId: string;
  username: string;
  role: "host" | "player";
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET(), { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET()) as AuthPayload;
}

/** Express middleware — extracts user from Authorization: Bearer <token> */
export function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing token" });
    return;
  }
  try {
    const payload = verifyToken(header.slice(7));
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Need to import express types
import type express from "express";

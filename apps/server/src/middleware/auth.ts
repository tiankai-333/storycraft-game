import jwt from "jsonwebtoken";
import type express from "express";

const JWT_SECRET = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is required. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
  return secret;
};

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

/** Require auth — rejects if no valid token */
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

/** Optional auth — extracts user if token present, but doesn't reject */
export function optionalAuth(req: express.Request, _res: express.Response, next: express.NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = verifyToken(header.slice(7));
      (req as any).user = payload;
    } catch { /* invalid token — treat as guest */ }
  }
  next();
}

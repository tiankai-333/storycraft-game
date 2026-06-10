import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { getDb, saveDb } from "../db/client.js";
import { signToken, authMiddleware, type AuthPayload } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/register
router.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "username and password required" });
    return;
  }
  if (password.length < 4) {
    res.status(400).json({ error: "password must be at least 4 characters" });
    return;
  }

  const db = getDb();
  const existing = db.exec("SELECT id FROM users WHERE username = ?", [username]);
  if (existing.length > 0 && existing[0].values.length > 0) {
    res.status(409).json({ error: "username already taken" });
    return;
  }

  const id = randomUUID();
  const hash = bcrypt.hashSync(password, 10);

  // First user becomes host
  const countResult = db.exec("SELECT COUNT(*) FROM users");
  const userCount = countResult.length > 0 ? (countResult[0].values[0]?.[0] as number) : 0;
  const role = userCount === 0 ? "host" : "player";

  db.run("INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)", [id, username, hash, role]);
  saveDb();

  const token = signToken({ userId: id, username, role: role as "host" | "player" });
  res.status(201).json({ token, user: { id, username, role } });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "username and password required" });
    return;
  }

  const db = getDb();
  const result = db.exec("SELECT id, username, password, role FROM users WHERE username = ?", [username]);
  if (result.length === 0 || result[0].values.length === 0) {
    res.status(401).json({ error: "invalid username or password" });
    return;
  }

  const row = result[0];
  const colNames = row.columns;
  const vals = row.values[0];
  const rowObj: Record<string, any> = {};
  colNames.forEach((c: string, i: number) => { rowObj[c] = vals[i]; });

  if (!bcrypt.compareSync(password, rowObj.password)) {
    res.status(401).json({ error: "invalid username or password" });
    return;
  }

  const token = signToken({ userId: rowObj.id as string, username: rowObj.username as string, role: rowObj.role as "host" | "player" });
  res.json({ token, user: { id: rowObj.id, username: rowObj.username, role: rowObj.role } });
});

// GET /api/auth/me
router.get("/me", authMiddleware, (_req, res) => {
  const user = (_req as any).user as AuthPayload;
  res.json({ id: user.userId, username: user.username, role: user.role });
});

export default router;

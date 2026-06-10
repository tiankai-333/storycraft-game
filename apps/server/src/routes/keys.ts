import { Router } from "express";
import { randomUUID } from "crypto";
import { getDb, saveDb } from "../db/client.js";
import { encrypt, decrypt } from "../crypto.js";
import { authMiddleware, type AuthPayload } from "../middleware/auth.js";

const router = Router();

/** Helper: query first row from sql.js */
function queryFirst(sql: string, params: any[]): Record<string, any> | null {
  const db = getDb();
  const result = db.exec(sql, params);
  if (result.length === 0 || result[0].values.length === 0) return null;
  const cols = result[0].columns;
  const vals = result[0].values[0];
  const obj: Record<string, any> = {};
  cols.forEach((c: string, i: number) => { obj[c] = vals[i]; });
  return obj;
}

// GET /api/keys — resolve effective key config (own > host)
router.get("/", authMiddleware, (_req, res) => {
  const user = (_req as any).user as AuthPayload;

  // Try user's own key first
  const own = queryFirst("SELECT base_url, model, provider FROM api_keys WHERE user_id = ? AND is_host = 0", [user.userId]);
  if (own) {
    res.json({ source: "custom", baseUrl: own.base_url, model: own.model, provider: own.provider });
    return;
  }

  // Fall back to host key
  const host = queryFirst("SELECT base_url, model, provider FROM api_keys WHERE is_host = 1 LIMIT 1", []);
  if (host) {
    res.json({ source: "host", baseUrl: host.base_url, model: host.model, provider: host.provider });
    return;
  }

  res.json(null);
});

// POST /api/keys — save key
router.post("/", authMiddleware, (req, res) => {
  const user = (req as any).user as AuthPayload;
  const { apiKey, baseUrl, model, provider } = req.body;
  if (!apiKey || !baseUrl || !model) {
    res.status(400).json({ error: "apiKey, baseUrl, model required" });
    return;
  }

  const db = getDb();
  const isHost = user.role === "host" ? 1 : 0;
  const encryptedKey = encrypt(apiKey);

  const existing = queryFirst("SELECT id FROM api_keys WHERE user_id = ? AND is_host = ?", [user.userId, isHost]);
  if (existing) {
    db.run("UPDATE api_keys SET api_key = ?, base_url = ?, model = ?, provider = ? WHERE user_id = ? AND is_host = ?",
      [encryptedKey, baseUrl, model, provider || "deepseek", user.userId, isHost]);
  } else {
    db.run("INSERT INTO api_keys (id, user_id, provider, api_key, base_url, model, is_host) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [randomUUID(), user.userId, provider || "deepseek", encryptedKey, baseUrl, model, isHost]);
  }
  saveDb();

  res.json({ ok: true });
});

// DELETE /api/keys — remove own key
router.delete("/", authMiddleware, (req, res) => {
  const user = (req as any).user as AuthPayload;
  const db = getDb();
  db.run("DELETE FROM api_keys WHERE user_id = ? AND is_host = 0", [user.userId]);
  saveDb();
  res.json({ ok: true });
});

// POST /api/keys/test — test connectivity
router.post("/test", authMiddleware, async (_req, res) => {
  const user = (_req as any).user as AuthPayload;

  let row = queryFirst("SELECT api_key, base_url, model FROM api_keys WHERE user_id = ? AND is_host = 0", [user.userId]);
  if (!row) {
    row = queryFirst("SELECT api_key, base_url, model FROM api_keys WHERE is_host = 1 LIMIT 1", []);
  }
  if (!row) {
    res.status(400).json({ ok: false, error: "No API key configured" });
    return;
  }

  const apiKey = decrypt(row.api_key as string);
  try {
    const response = await fetch(`${row.base_url}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: row.model, messages: [{ role: "user", content: "ping" }], max_tokens: 5 }),
    });
    if (response.ok) {
      res.json({ ok: true, model: row.model });
    } else {
      const body = await response.text().catch(() => "");
      res.json({ ok: false, error: `API ${response.status}: ${body.slice(0, 100)}` });
    }
  } catch (err: any) {
    res.json({ ok: false, error: err.message });
  }
});

export default router;

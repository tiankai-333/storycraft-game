import { Router } from "express";
import { getDb } from "../db/client.js";
import { decrypt } from "../crypto.js";
import { optionalAuth, type AuthPayload } from "../middleware/auth.js";

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

// POST /api/ai/chat — proxy to AI provider (guest uses host key)
router.post("/chat", optionalAuth, async (req, res) => {
  const user = (req as any).user as AuthPayload | undefined;

  // Resolve key: logged-in own > host (guest always uses host)
  let row: Record<string, any> | null = null;
  if (user) {
    row = queryFirst("SELECT api_key, base_url, model FROM api_keys WHERE user_id = ? AND is_host = 0", [user.userId]);
  }
  if (!row) {
    row = queryFirst("SELECT api_key, base_url, model FROM api_keys WHERE is_host = 1 LIMIT 1", []);
  }
  if (!row) {
    res.status(400).json({ error: "No API key configured" });
    return;
  }

  const apiKey = decrypt(row.api_key as string);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${row.base_url}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });

    if (!response.ok) {
      // Don't forward upstream error body — may contain API key hints
      console.error(`[AI Proxy] Upstream ${response.status}`);
      res.status(response.status).json({ error: `AI provider returned ${response.status}` });
      return;
    }

    const ct = response.headers.get("content-type");
    if (ct) res.setHeader("content-type", ct);

    const text = await response.text();
    res.send(text);
  } catch (err: any) {
    console.error("[AI Proxy] Error:", err.message);
    res.status(502).json({ error: "AI proxy failed" });
  } finally {
    clearTimeout(timeout);
  }
});

export default router;

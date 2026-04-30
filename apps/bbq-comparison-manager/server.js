import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ───────────────────────────────────────────────────────────────────

const BUCKET       = process.env.R2_BUCKET;
const DATA_PREFIX  = process.env.R2_DATA_PREFIX || "data";
const ASSET_PREFIX = "assets";
const JWT_SECRET   = process.env.JWT_SECRET || "change-me-in-production";
const PORT         = process.env.PORT || process.env.API_PORT || 3001;
const IS_PROD      = process.env.NODE_ENV === "production";
const LOCK_TTL_MS  = 15 * 60 * 1000; // 15 minutes

const DATASETS = [
  "brands", "families", "variants", "specs",
  "assets", "colors", "variantColors",
];

// Parse ADMIN_USERS="alice:pass1,bob:pass2"
const USERS = (process.env.ADMIN_USERS || "admin:admin123")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => {
    const idx = s.indexOf(":");
    return { username: s.slice(0, idx), password: s.slice(idx + 1) };
  });

// ── R2 client ────────────────────────────────────────────────────────────────

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// ── In-memory data cache ──────────────────────────────────────────────────────

let dataCache = null;

async function readFromR2(key) {
  const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return obj.Body.transformToString();
}

async function writeToR2(key, body, contentType = "application/json; charset=utf-8") {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: "no-store",
  }));
}

async function loadCache() {
  console.log("Loading data from R2…");
  const result = {};
  await Promise.all(
    DATASETS.map(async (ds) => {
      try {
        const content = await readFromR2(`${DATA_PREFIX}/${ds}.json`);
        result[ds] = JSON.parse(content);
      } catch {
        result[ds] = [];
      }
    })
  );
  dataCache = result;
  console.log("Data loaded:", Object.fromEntries(DATASETS.map((ds) => [ds, result[ds].length])));
  return dataCache;
}

async function getCache() {
  if (!dataCache) await loadCache();
  return dataCache;
}

async function saveDataset(dataset, data) {
  const cache = await getCache();
  cache[dataset] = data;
  await writeToR2(
    `${DATA_PREFIX}/${dataset}.json`,
    JSON.stringify(data, null, 2)
  );
}

// ── Lock management ───────────────────────────────────────────────────────────

const locks = new Map(); // variantId → { username, acquiredAt, expiresAt }

function cleanExpiredLocks() {
  const now = Date.now();
  for (const [id, lock] of locks) {
    if (lock.expiresAt < now) locks.delete(id);
  }
}
setInterval(cleanExpiredLocks, 60_000);

function acquireLock(variantId, username) {
  cleanExpiredLocks();
  const existing = locks.get(variantId);
  if (existing && existing.expiresAt > Date.now()) {
    if (existing.username !== username) return { ok: false, lockedBy: existing.username };
  }
  const now = Date.now();
  locks.set(variantId, {
    username,
    acquiredAt: new Date(now).toISOString(),
    expiresAt: now + LOCK_TTL_MS,
  });
  return { ok: true };
}

function releaseLock(variantId, username) {
  const existing = locks.get(variantId);
  if (existing && existing.username === username) locks.delete(variantId);
}

function renewLock(variantId, username) {
  const existing = locks.get(variantId);
  if (!existing || existing.username !== username) return false;
  existing.expiresAt = Date.now() + LOCK_TTL_MS;
  return true;
}

function getLocks() {
  cleanExpiredLocks();
  return Object.fromEntries(
    Array.from(locks.entries()).map(([id, l]) => [id, l])
  );
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

function signToken(username) {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: "12h" });
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ── Express app ───────────────────────────────────────────────────────────────

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// ── Auth routes ───────────────────────────────────────────────────────────────

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = USERS.find((u) => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid username or password" });
  res.json({ token: signToken(username), username });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json({ username: req.user.username });
});

// ── Config route ──────────────────────────────────────────────────────────────

app.get("/api/config", authMiddleware, (_req, res) => {
  res.json({
    assetBaseUrl: process.env.ASSET_BASE_URL || "https://bbqcompareassets.brcreated.app/assets",
  });
});

// ── Data routes ───────────────────────────────────────────────────────────────

app.get("/api/data", authMiddleware, async (_req, res) => {
  try {
    res.json(await getCache());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/data/:dataset", authMiddleware, async (req, res) => {
  const { dataset } = req.params;
  if (!DATASETS.includes(dataset)) return res.status(400).json({ error: "Invalid dataset" });
  try {
    await saveDataset(dataset, req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Lock routes ───────────────────────────────────────────────────────────────

app.get("/api/locks", authMiddleware, (_req, res) => {
  res.json(getLocks());
});

app.post("/api/locks/acquire/:variantId", authMiddleware, (req, res) => {
  const result = acquireLock(req.params.variantId, req.user.username);
  if (!result.ok) return res.status(409).json({ error: `Being edited by ${result.lockedBy}`, lockedBy: result.lockedBy });
  res.json({ ok: true });
});

app.post("/api/locks/release/:variantId", authMiddleware, (req, res) => {
  releaseLock(req.params.variantId, req.user.username);
  res.json({ ok: true });
});

app.post("/api/locks/renew/:variantId", authMiddleware, (req, res) => {
  const ok = renewLock(req.params.variantId, req.user.username);
  res.json({ ok });
});

// ── Image routes ──────────────────────────────────────────────────────────────

app.post("/api/images/upload", authMiddleware, upload.single("file"), async (req, res) => {
  const file = req.file;
  const { brandId, variantId } = req.body;
  if (!file) return res.status(400).json({ error: "No file provided" });
  if (!brandId || !variantId) return res.status(400).json({ error: "brandId and variantId required" });

  const ext  = path.extname(file.originalname).toLowerCase();
  const base = path.basename(file.originalname, ext).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  const filename = `${base}${ext}`;
  const filePath = `products/${brandId}/${variantId}/${filename}`;

  try {
    await writeToR2(`${ASSET_PREFIX}/${filePath}`, file.buffer, file.mimetype);
    res.json({ filePath, filename });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/images", authMiddleware, async (req, res) => {
  const { filePath } = req.body;
  if (!filePath) return res.status(400).json({ error: "filePath required" });
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: `${ASSET_PREFIX}/${filePath}` }));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Reload cache (force re-fetch from R2) ────────────────────────────────────

app.post("/api/reload", authMiddleware, async (_req, res) => {
  try {
    dataCache = null;
    await loadCache();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Static files (production) ─────────────────────────────────────────────────

if (IS_PROD) {
  const distPath = path.join(__dirname, "dist");
  app.use(express.static(distPath));
  app.get(/.*/, (_req, res) => res.sendFile(path.join(distPath, "index.html")));
}

// ── Start ─────────────────────────────────────────────────────────────────────

loadCache().then(() => {
  app.listen(PORT, () => {
    console.log(`BBQ Compare Admin running on http://localhost:${PORT}`);
    if (!IS_PROD) console.log("Dev mode — Vite runs separately on port 5174");
  });
}).catch((e) => {
  console.error("Failed to load data from R2:", e.message);
  process.exit(1);
});

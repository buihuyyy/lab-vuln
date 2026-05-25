const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const db = require("./db");

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "pv_super_secret_do_not_share_2026";

const app = express();
app.use(express.json());
app.use(cookieParser());

const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
app.use(express.static(FRONTEND_DIR));

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send("User-agent: *\nDisallow: /staff/archive\n");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "parcelvault", time: new Date().toISOString() });
});

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.session;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid session" });
  }
}

// Intentionally flawed middleware: decodes JWT but never verifies signature.
function staffGate(req, res, next) {
  const token = req.cookies && req.cookies.session;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  const decoded = jwt.decode(token);
  if (!decoded || decoded.role !== "staff") {
    return res.status(403).json({ error: "Staff clearance required" });
  }
  req.user = decoded;
  return next();
}

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }
  const row = db
    .prepare("SELECT username, password, role FROM users WHERE username = ?")
    .get(username);
  if (!row || row.password !== password) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  const token = jwt.sign(
    { username: row.username, role: row.role },
    JWT_SECRET,
    { algorithm: "HS256", expiresIn: "2h" }
  );
  res.cookie("session", token, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 2 * 60 * 60 * 1000,
  });
  res.json({ ok: true, username: row.username, role: row.role });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("session");
  res.json({ ok: true });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ username: req.user.username, role: req.user.role });
});

app.get("/api/shipments", requireAuth, (req, res) => {
  const rows = db
    .prepare(
      "SELECT tracking, origin, destination, status, updated_at FROM shipments WHERE owner = ?"
    )
    .all(req.user.username);
  res.json({ shipments: rows });
});

app.get("/api/staff/archive", staffGate, (req, res) => {
  const rows = db
    .prepare("SELECT case_no, note, classification FROM archive")
    .all();
  res.json({ archive: rows, accessed_by: req.user.username });
});

app.get("/staff/archive", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "dashboard.html"));
});

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found" });
  }
  res.status(404).sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`ParcelVault listening on :${PORT}`);
});

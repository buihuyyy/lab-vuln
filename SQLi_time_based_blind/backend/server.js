const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'app.db');
const PORT = process.env.PORT || 3000;

if (!fs.existsSync(DB_PATH)) {
  console.error('[server] Database not found. Run: node seed.js');
  process.exit(1);
}

const db = new Database(DB_PATH);
const MAX_SLEEP_MS = 3000;
db.function('sleep_ms', (ms) => {
  let n = Number(ms);
  if (!Number.isFinite(n) || n < 0) n = 0;
  if (n > MAX_SLEEP_MS) n = MAX_SLEEP_MS;
  const end = Date.now() + n;
  while (Date.now() < end) {}
  return n;
});

const app = express();

app.get('/', (req, res) => {
  res.type('html').send(`
    <!doctype html>
    <html><head><meta charset="utf-8"><title>Coupon Checker</title>
    <style>
      body{font-family:system-ui,sans-serif;background:#0f1115;color:#e6e6e6;margin:0;padding:2rem;}
      .card{max-width:560px;margin:3rem auto;background:#1a1d24;padding:2rem;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.4);}
      h1{margin:0 0 .5rem;color:#7ad7ff;}
      .hint{color:#888;font-size:.85rem;font-style:italic;margin-top:1.5rem;}
      input{width:100%;padding:.6rem;border-radius:6px;border:1px solid #333;background:#0f1115;color:#e6e6e6;font-size:1rem;box-sizing:border-box;}
      button{margin-top:.8rem;padding:.6rem 1.2rem;background:#7ad7ff;color:#0f1115;border:0;border-radius:6px;font-weight:600;cursor:pointer;}
      a{color:#7ad7ff;}
    </style></head>
    <body>
      <div class="card">
        <h1>Coupon Checker</h1>
        <p>Enter a discount code to check if it's valid.</p>
        <form action="/coupon" method="get">
          <input name="code" placeholder="e.g. WELCOME10" autocomplete="off"/>
          <button type="submit">Check</button>
        </form>
        <p class="hint">Hint: Sometimes silence has timing.</p>
      </div>
    </body></html>
  `);
});
app.get('/coupon', (req, res) => {
  const code = String(req.query.code || '');
  const sql = "SELECT id, discount FROM coupons WHERE active = 1 AND code = '" + code + "'";

  try {
    db.prepare(sql).get();
  } catch (e) {
  }

  res.type('html').send(`
    <!doctype html>
    <html><head><meta charset="utf-8"><title>Coupon Checker</title>
    <style>
      body{font-family:system-ui,sans-serif;background:#0f1115;color:#e6e6e6;margin:0;padding:2rem;}
      .card{max-width:560px;margin:3rem auto;background:#1a1d24;padding:2rem;border-radius:12px;}
      a{color:#7ad7ff;}
    </style></head>
    <body><div class="card">
      <h2>Thanks!</h2>
      <p>Your request has been processed.</p>
      <p><a href="/">&larr; back</a></p>
    </div></body></html>
  `);
});

app.listen(PORT, () => {
  console.log(`[server] Coupon Checker running on http://localhost:${PORT}`);
});

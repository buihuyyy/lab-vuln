const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'app.db');

const db = new Database(DB_PATH, { readonly: false });

app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

const PAGE = (body) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tracking Portal</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>📦 Tracking Portal</h1>
      <p class="sub">Enter your tracking code to check your package status.</p>
    </header>
    <form method="GET" action="/track" class="track-form">
      <input type="text" name="code" placeholder="e.g. TRK1001" autocomplete="off" required>
      <button type="submit">Track</button>
    </form>
    ${body}
    <footer>
      <p class="hint">Hint: The answer is only yes or no.</p>
    </footer>
  </div>
</body>
</html>`;

app.get('/', (req, res) => {
  res.send(PAGE(''));
});

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

app.get('/track', async (req, res) => {
  const code = req.query.code || '';

  await sleep(400);
  const sql = `SELECT id FROM shipments WHERE tracking_code = '${code}'`;

  let found = false;
  try {
    const row = db.prepare(sql).get();
    found = !!row;
  } catch (e) {
    found = false;
  }

  const message = found
    ? `<div class="result ok">Package found</div>`
    : `<div class="result no">Package not found</div>`;

  res.send(PAGE(message));
});

app.listen(PORT, () => {
  console.log(`Tracking Portal listening on http://localhost:${PORT}`);
});

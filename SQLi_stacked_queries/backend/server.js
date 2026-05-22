const express = require('express');
const path = require('path');
const { resetAndInit } = require('./db');

const db = resetAndInit();
const app = express();
const PORT = process.env.PORT || 3000;

const CURRENT_USER = 'guest';

app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

function layout(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title} — Todo Archive</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <header>
    <h1>Todo Archive</h1>
    <nav>
      <a href="/">Home</a>
      <a href="/todos?id=1">Todo #1</a>
      <a href="/secret">Secret Vault</a>
    </nav>
    <div class="user">Logged in as: <b>${CURRENT_USER}</b></div>
  </header>
  <main>${body}</main>
</body>
</html>`;
}

app.get('/', (_req, res) => {
  const rows = db.prepare(
    'SELECT id, title FROM todos WHERE is_public = 1 ORDER BY id ASC'
  ).all();
  const list = rows
    .map((r) => `<li><a href="/todos?id=${r.id}">#${r.id} — ${r.title}</a></li>`)
    .join('');
  res.send(
    layout(
      'Home',
      `<h2>Public Todos</h2>
       <ul class="todos">${list}</ul>
       <p>View a single todo via <code>/todos?id=&lt;number&gt;</code>.</p>`
    )
  );
});

app.get('/todos', (req, res) => {
  const rawId = req.query.id ?? '';

  try {
    const now = new Date().toISOString();
    const sql =
      `INSERT INTO access_log (query_id, created_at) VALUES ('${rawId}', '${now}');`;
    db.exec(sql); // <-- stacked queries possible here
  } catch (err) {
    return res.status(400).send(
      layout('Error', `<h2>Bad lookup</h2><pre>${escapeHtml(err.message)}</pre>`)
    );
  }

  const numericId = parseInt(rawId, 10);
  let row = null;
  if (Number.isInteger(numericId)) {
    row = db
      .prepare('SELECT id, title, content, is_public FROM todos WHERE id = ?')
      .get(numericId);
  }

  if (!row) {
    return res.send(
      layout(
        'Not found',
        `<h2>No todo found</h2>
         <p>Nothing matches <code>id=${escapeHtml(String(rawId))}</code>.</p>
         <p><a href="/">Back</a></p>`
      )
    );
  }

  if (!row.is_public) {
    return res.send(
      layout(
        'Private',
        `<h2>${escapeHtml(row.title)}</h2>
         <p><i>This todo is private.</i></p>`
      )
    );
  }

  res.send(
    layout(
      row.title,
      `<h2>${escapeHtml(row.title)}</h2>
       <article>${escapeHtml(row.content)}</article>
       <p><a href="/">Back</a></p>`
    )
  );
});

app.get('/secret', (_req, res) => {
  const access = db
    .prepare('SELECT can_view_secret FROM user_access WHERE username = ?')
    .get(CURRENT_USER);

  if (!access || access.can_view_secret !== 1) {
    return res.status(403).send(
      layout(
        'Secret Vault',
        `<h2>Secret Vault</h2>
         <p>Access denied for user <b>${CURRENT_USER}</b>.</p>
         <p>Only users whose <code>can_view_secret</code> flag is set may read this vault.</p>`
      )
    );
  }

  const secret = db
    .prepare('SELECT secret_content FROM secret_todos ORDER BY id ASC LIMIT 1')
    .get();

  res.send(
    layout(
      'Secret Vault',
      `<h2>Secret Vault</h2>
       <article class="flag">${escapeHtml(secret.secret_content)}</article>`
    )
  );
});

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

app.listen(PORT, () => {
  console.log(`Todo Archive listening on http://0.0.0.0:${PORT}`);
});

const express = require('express');
const fs = require('fs');
const path = require('path');
const { db, init } = require('./db');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

init();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Book Finder</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header>
    <h1>📚 Book Finder</h1>
    <nav><a href="/">Home</a> | <a href="/books">Books</a></nav>
  </header>
  <main>${body}</main>
  <footer><small>Local lab only. Do not expose to the internet.</small></footer>
</body>
</html>`;
}

app.get('/', (req, res) => {
  res.send(
    layout(`
    <section>
      <h2>Welcome</h2>
      <p>This is a small library search demo. Use the <a href="/books">Books</a> page to look up titles.</p>
    </section>
  `)
  );
});

app.get('/books', (req, res) => {
  const keyword = req.query.q !== undefined ? String(req.query.q) : '';
  let rows = [];
  let queryError = false;

  if (keyword !== '') {
    const sql =
      "SELECT id, title, author, description FROM books " +
      "WHERE title LIKE '%" + keyword + "%' OR author LIKE '%" + keyword + "%'";
    try {
      rows = db.prepare(sql).all();
    } catch (e) {
      queryError = true;
    }
  }

  let resultHtml = '';
  if (keyword === '') {
    resultHtml = '<p class="muted">Enter a keyword to search the catalog.</p>';
  } else if (queryError) {
    resultHtml = '<p class="muted">No results.</p>';
  } else if (rows.length === 0) {
    resultHtml = '<p class="muted">No results.</p>';
  } else {
    const trs = rows
      .map(
        (r) => `
        <tr>
          <td>${escapeHtml(r.id)}</td>
          <td>${escapeHtml(r.title)}</td>
          <td>${escapeHtml(r.author)}</td>
          <td>${escapeHtml(r.description)}</td>
        </tr>`
      )
      .join('');
    resultHtml = `
      <table class="results">
        <thead>
          <tr><th>ID</th><th>Title</th><th>Author</th><th>Description</th></tr>
        </thead>
        <tbody>${trs}</tbody>
      </table>`;
  }

  res.send(
    layout(`
    <section>
      <h2>Search the catalog</h2>
      <form method="GET" action="/books">
        <input type="text" name="q" placeholder="title or author"
               value="${escapeHtml(keyword)}" autocomplete="off">
        <button type="submit">Search</button>
      </form>
      ${resultHtml}
    </section>
  `)
  );
});

app.use((req, res) => {
  res.status(404).send(layout('<p>Not found.</p>'));
});

app.listen(PORT, () => {
  console.log(`Book Finder lab listening on http://localhost:${PORT}`);
});

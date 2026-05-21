const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DEBUG = (process.env.DEBUG || 'true').toLowerCase() === 'true';

const db = new Database(':memory:');

function seed() {
  db.exec(`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT
    );
    CREATE TABLE secrets (
      id INTEGER PRIMARY KEY,
      secret_key TEXT NOT NULL,
      secret_value TEXT NOT NULL
    );
  `);

  const insertProduct = db.prepare('INSERT INTO products (id, name, price, description) VALUES (?, ?, ?, ?)');
  insertProduct.run(1, 'Rubber Duck', 9.99, 'The legendary debugging companion.');
  insertProduct.run(2, 'Mechanical Keyboard', 129.0, 'Loud, proud, and clicky.');
  insertProduct.run(3, 'USB Coffee Warmer', 14.5, 'Because cold coffee is a crime.');
  insertProduct.run(4, 'Sticker Pack', 4.0, 'Decorate your laptop like a pro.');

  const insertSecret = db.prepare('INSERT INTO secrets (id, secret_key, secret_value) VALUES (?, ?, ?)');
  insertSecret.run(1, 'FLAG', 'buiih{err0r_b4sed_sqli_l34ks_d4t4}');
  insertSecret.run(2, 'NOTE', 'Do not expose debug mode in production.');
}
seed();

app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

function layout(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header>
    <h1><a href="/">DuckShop</a></h1>
    <nav>
      <a href="/">Home</a>
      <a href="/product?id=1">Product #1</a>
    </nav>
  </header>
  <main>${body}</main>
  <footer>
    <small>DuckShop</small>
  </footer>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

app.get('/', (req, res) => {
  const rows = db.prepare('SELECT id, name, price FROM products ORDER BY id').all();
  const list = rows
    .map(
      (r) => `<li><a href="/product?id=${r.id}">#${r.id} &mdash; ${escapeHtml(r.name)}</a> <span class="price">$${r.price.toFixed(2)}</span></li>`
    )
    .join('');
  res.send(
    layout(
      'DuckShop',
      `<section class="card">
        <h2>Products</h2>
        <ul class="product-list">${list}</ul>
      </section>`
    )
  );
});

app.get('/product', (req, res) => {
  const id = req.query.id;

  if (id === undefined || id === '') {
    return res.status(400).send(
      layout(
        'Missing id',
        `<section class="card"><h2>Missing parameter</h2><p>Please provide ?id=&lt;product_id&gt;</p></section>`
      )
    );
  }


  const query = `SELECT id, name, price, description FROM products WHERE id = ${id}`;

  try {
    const row = db.prepare(query).get();

    if (!row) {
      return res.send(
        layout(
          'Not found',
          `<section class="card">
            <h2>No such product</h2>
            <p>Query returned no rows.</p>
            ${DEBUG ? `<pre class="debug-query">${escapeHtml(query)}</pre>` : ''}
          </section>`
        )
      );
    }

    res.send(
      layout(
        `Product #${row.id}`,
        `<section class="card">
          <h2>${escapeHtml(row.name)}</h2>
          <p class="price">$${Number(row.price).toFixed(2)}</p>
          <p>${escapeHtml(row.description || '')}</p>
          ${DEBUG ? `<pre class="debug-query">${escapeHtml(query)}</pre>` : ''}
        </section>`
      )
    );
  } catch (err) {
    res.status(200).send(
      layout(
        'Database error',
        `<section class="card">
          <h2>Product lookup</h2>
          <p>Something went wrong while reading the product.</p>
          <div class="error-box">
            <strong>Database error:</strong>
            <pre>${escapeHtml(err.message)}</pre>
            ${DEBUG ? `<details><summary>Debug: executed query</summary><pre>${escapeHtml(query)}</pre></details>` : ''}
          </div>
        </section>`
      )
    );
  }
});

app.use((req, res) => {
  res.status(404).send(layout('404', `<section class="card"><h2>404</h2><p>Not found.</p></section>`));
});

app.listen(PORT, () => {
  console.log(`[broken-product-debug] listening on http://localhost:${PORT}  (DEBUG=${DEBUG})`);
});

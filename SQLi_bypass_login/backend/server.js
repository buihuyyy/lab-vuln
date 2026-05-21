const express = require('express');
const session = require('express-session');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'app.db');
if (!fs.existsSync(DB_PATH)) {
  console.error('Database not found. Run `node init-db.js` first.');
  process.exit(1);
}
const db = new Database(DB_PATH, { readonly: false });

const FLAG = process.env.FLAG || 'buiih{l3g4cy_l0gin_qu3ry_n3v3r_di3s}';

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));
app.use(session({
  secret: 'old-admin-panel-' + Math.random().toString(36).slice(2),
  resave: false,
  saveUninitialized: false
}));

function render(file, vars = {}) {
  let html = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'views', file), 'utf8');
  for (const [k, v] of Object.entries(vars)) {
    html = html.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), v);
  }
  return html;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => {
  res.send(render('login.html', { error: '' }));
});

app.post('/login', (req, res) => {
  const { username = '', password = '' } = req.body;

  const query =
    "SELECT id, username, role FROM users " +
    "WHERE username = '" + username + "' AND password = '" + password + "'";

  let row;
  try {
    row = db.prepare(query).get();
  } catch (e) {
    return res.status(400).send(render('login.html', {
      error: 'Query error: ' + escapeHtml(e.message)
    }));
  }

  if (!row) {
    return res.status(401).send(render('login.html', {
      error: 'Invalid credentials.'
    }));
  }

  req.session.user = { id: row.id, username: row.username, role: row.role };
  return res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { username, role } = req.session.user;

  if (role === 'admin') {
    return res.send(render('admin.html', {
      username: escapeHtml(username),
      flag: escapeHtml(FLAG)
    }));
  }
  return res.send(render('dashboard.html', {
    username: escapeHtml(username),
    role: escapeHtml(role)
  }));
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[old-admin-panel] listening on http://0.0.0.0:${PORT}`);
});

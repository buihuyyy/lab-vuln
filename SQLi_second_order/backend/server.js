const express = require('express');
const session = require('express-session');
const path = require('path');
const { init, DB_PATH } = require('./db');
const Database = require('better-sqlite3');

const db = init();
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));
app.use(session({
  secret: 'profile-review-lab-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true }
}));

function layout(title, body, user) {
  const nav = user
    ? `<span>Logged in as <b>${escapeHtml(user.username)}</b></span>
       <a href="/profile">Profile</a>
       <a href="/review">Review</a>
       <a href="/logout">Logout</a>`
    : `<a href="/login">Login</a> <a href="/register">Register</a>`;
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title>
<link rel="stylesheet" href="/style.css"></head>
<body>
  <header><h1>Profile Review</h1><nav>${nav}</nav></header>
  <main>${body}</main>
  <footer><small>CTF Lab - Second-order SQL Injection</small></footer>
</body></html>`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

app.get('/', (req, res) => {
  res.send(layout('Home', `
    <p>Welcome to the <b>Profile Review</b> service.</p>
    <p>Users can register, set a display name, and request a profile review.</p>
    <p><i>Hint: Stored data can become dangerous later.</i></p>
  `, req.session.user));
});

app.get('/register', (req, res) => {
  res.send(layout('Register', `
    <h2>Register</h2>
    <form method="post" action="/register">
      <label>Username <input name="username" required maxlength="32"></label>
      <label>Password <input name="password" type="password" required></label>
      <label>Display name <input name="display_name" maxlength="200"></label>
      <button type="submit">Register</button>
    </form>
    ${req.query.err ? `<p class="err">${escapeHtml(req.query.err)}</p>` : ''}
  `, req.session.user));
});

app.post('/register', (req, res) => {
  const { username, password, display_name } = req.body;
  if (!username || !password) return res.redirect('/register?err=missing+fields');
  try {
    db.prepare('INSERT INTO users (username, password, display_name) VALUES (?, ?, ?)')
      .run(username, password, display_name || '');
  } catch (e) {
    return res.redirect('/register?err=' + encodeURIComponent(e.message));
  }
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.send(layout('Login', `
    <h2>Login</h2>
    <form method="post" action="/login">
      <label>Username <input name="username" required></label>
      <label>Password <input name="password" type="password" required></label>
      <button type="submit">Login</button>
    </form>
    ${req.query.err ? `<p class="err">${escapeHtml(req.query.err)}</p>` : ''}
  `, req.session.user));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const u = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?')
    .get(username, password);
  if (!u) return res.redirect('/login?err=invalid');
  req.session.user = { id: u.id, username: u.username };
  res.redirect('/profile');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.get('/profile', requireLogin, (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
  res.send(layout('Profile', `
    <h2>Your Profile</h2>
    <p>Username: <b>${escapeHtml(u.username)}</b></p>
    <p>Current display name (stored):</p>
    <pre>${escapeHtml(u.display_name)}</pre>
    <form method="post" action="/profile">
      <label>Update display name
        <input name="display_name" value="${escapeHtml(u.display_name)}" maxlength="200">
      </label>
      <button type="submit">Save</button>
    </form>
    <hr>
    <form method="post" action="/review/request">
      <button type="submit">Request profile review</button>
    </form>
    ${req.query.msg ? `<p class="ok">${escapeHtml(req.query.msg)}</p>` : ''}
  `, req.session.user));
});

app.post('/profile', requireLogin, (req, res) => {
  const { display_name } = req.body;
  // Safe parameterized update - payload sits harmlessly in the DB.
  db.prepare('UPDATE users SET display_name = ? WHERE id = ?')
    .run(display_name || '', req.session.user.id);
  res.redirect('/profile?msg=Display+name+updated');
});

app.post('/review/request', requireLogin, (req, res) => {
  res.redirect('/review');
});

app.get('/review', requireLogin, (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
  const stored = u.display_name || '';

  let note = '';
  let err = '';
  try {
    const sql = "SELECT 'Reviewing profile of user: ' || '" + stored + "' AS note";
    const row = db.prepare(sql).get();
    note = row ? row.note : '';
  } catch (e) {
    err = e.message;
  }

  res.send(layout('Review', `
    <h2>Profile Review</h2>
    <p>Stored display name being processed:</p>
    <pre>${escapeHtml(stored)}</pre>
    <h3>Review output</h3>
    ${err
      ? `<pre class="err">SQL error: ${escapeHtml(err)}</pre>`
      : `<pre class="ok">${escapeHtml(note)}</pre>`}
    <p><a href="/profile">Back to profile</a></p>
  `, req.session.user));
});

app.listen(PORT, () => {
  console.log(`Profile Review lab running on http://localhost:${PORT}`);
  console.log(`DB: ${DB_PATH}`);
});

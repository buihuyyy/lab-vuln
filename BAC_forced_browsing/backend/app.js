const express = require('express');
const session = require('express-session');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

const db = new Database(':memory:');
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
  );
`);
const insert = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
insert.run('guest', 'guest123', 'user');
insert.run('staff', 'staff123', 'user');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'frontend', 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

app.use(session({
  secret: 'forced-browsing-lab-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true }
}));

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login', { error: null, user: req.session.user });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const row = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  if (!row) {
    return res.render('login', { error: 'Invalid credentials', user: null });
  }
  req.session.user = { id: row.id, username: row.username, role: row.role };
  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/dashboard', requireLogin, (req, res) => {
  res.render('dashboard', { user: req.session.user });
});

app.get('/docs/public', requireLogin, (req, res) => {
  res.render('public_docs', { user: req.session.user });
});

app.get('/internal', requireLogin, (req, res) => {
  res.status(404).render('404', {
    user: req.session.user,
    url: req.originalUrl,
    hint: 'Did you mean /internal/backup-codes ?'
  });
});

app.get('/internal/', requireLogin, (req, res) => {
  res.status(404).render('404', {
    user: req.session.user,
    url: req.originalUrl,
    hint: 'Did you mean /internal/backup-codes ?'
  });
});

app.get('/internal/backup-codes', requireLogin, (req, res) => {
  res.render('backup_codes', {
    user: req.session.user,
    flag: 'buiih{forced_browsing_hidden_path}'
  });
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /internal/\n');
});

app.use((req, res) => {
  res.status(404).render('404', { user: req.session.user, url: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`[+] BAC Forced Browsing lab running at http://localhost:${PORT}`);
});

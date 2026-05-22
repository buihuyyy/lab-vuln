const express = require('express');
const session = require('express-session');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const db = new Database(':memory:');

const FLAG = 'buiih{method_based_authz_bypass}';

db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
  );
`);
db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run('admin', 'admin123', 'admin');
db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run('newbie', 'newbie123', 'user');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'frontend', 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));
app.use(session({
  secret: 'bac-method-bypass-secret',
  resave: false,
  saveUninitialized: false,
}));

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
  if (!user || user.role !== 'admin') {
    res.set('X-Debug-Hint', 'Admins must call GET /admin/users/<id>/role?role=<user|admin> to change a user\'s role.');
    return res.status(403).send('Forbidden: admin only');
  }
  next();
}

app.get('/', (req, res) => res.redirect('/dashboard'));

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  if (!user) return res.render('login', { error: 'Invalid credentials' });
  req.session.userId = user.id;
  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/dashboard', requireLogin, (req, res) => {
  const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(req.session.userId);
  res.render('dashboard', { user });
});

app.get('/admin', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, username, role FROM users').all();
  res.render('admin', { users, flag: FLAG });
});

app.post('/admin/users/:id/role', requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).send('Invalid role');
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.redirect('/admin');
});

app.get('/admin/users/:id/role', requireLogin, (req, res) => {
  const role = req.query.role;
  if (!['user', 'admin'].includes(role)) return res.status(400).send('Invalid role');
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ ok: true, id: Number(req.params.id), role });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`BAC method-bypass lab running at http://localhost:${PORT}`);
});

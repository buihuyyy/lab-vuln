const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const FLAG = 'buiih{mass_assignment_role_override}';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'frontend', 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'bac-mass-assignment-secret',
  resave: false,
  saveUninitialized: false
}));

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

function loadUser(req, res, next) {
  db.get('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (err || !user) return res.redirect('/login');
    req.user = user;
    next();
  });
}

app.get('/', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, user) => {
      if (err || !user) {
        return res.render('login', { error: 'Invalid credentials' });
      }
      req.session.userId = user.id;
      res.redirect('/dashboard');
    }
  );
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/dashboard', requireLogin, loadUser, (req, res) => {
  res.render('dashboard', { user: req.user });
});

app.get('/profile/edit', requireLogin, loadUser, (req, res) => {
  res.render('edit', { user: req.user });
});

// VULNERABLE: mass assignment — all keys from req.body are written to the DB.
app.post('/profile/edit', requireLogin, loadUser, (req, res) => {
  const allowedColumns = ['username', 'password', 'role', 'displayName', 'bio'];
  const updates = [];
  const values = [];

  for (const key of Object.keys(req.body)) {
    if (allowedColumns.includes(key)) {
      updates.push(`${key} = ?`);
      values.push(req.body[key]);
    }
  }

  if (updates.length === 0) {
    return res.redirect('/profile/edit');
  }

  values.push(req.user.id);
  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  db.run(sql, values, (err) => {
    if (err) return res.status(500).send('Update failed');
    res.redirect('/dashboard');
  });
});

app.get('/admin', requireLogin, loadUser, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).render('forbidden', { user: req.user });
  }
  res.render('admin', { user: req.user, flag: FLAG });
});

app.use((req, res) => {
  res.status(404).send('Not Found');
});

app.listen(PORT, () => {
  console.log(`BAC mass-assignment lab running at http://localhost:${PORT}`);
});

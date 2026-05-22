const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'frontend', 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));
app.use(
  session({
    secret: 'lab-insecure-secret',
    resave: false,
    saveUninitialized: false,
  })
);

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

app.get('/', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db
    .prepare('SELECT * FROM users WHERE username = ? AND password = ?')
    .get(username, password);

  if (!user) {
    return res.status(401).render('login', { error: 'Invalid username or password.' });
  }

  req.session.userId = user.id;
  req.session.username = user.username;
  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/dashboard', requireLogin, (req, res) => {

  const invoices = db
    .prepare(
      "SELECT id, title, amount FROM invoices WHERE owner_id = ? AND title NOT LIKE 'CONFIDENTIAL%' ORDER BY id ASC"
    )
    .all(req.session.userId);

  res.render('dashboard', {
    username: req.session.username,
    invoices,
  });
});

app.get('/invoice/:id', requireLogin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).send('Invalid id');

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  if (!invoice) return res.status(404).render('notfound');

  res.render('invoice', {
    username: req.session.username,
    invoice,
  });
});

app.use((req, res) => res.status(404).render('notfound'));

app.listen(PORT, () => {
  console.log(`[lab] BAC/IDOR lab running at http://localhost:${PORT}`);
});

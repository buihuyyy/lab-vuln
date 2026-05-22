const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const FLAG = 'buiih{missing_access_control_endpoint}';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'frontend', 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

app.use(session({
  secret: 'bac-lab-secret',
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
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  if (!user) {
    return res.render('login', { error: 'Invalid credentials' });
  }
  req.session.user = { id: user.id, username: user.username, role: user.role };
  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/dashboard', requireLogin, (req, res) => {
  const posts = db.prepare('SELECT * FROM posts WHERE user_id = ? ORDER BY id DESC').all(req.session.user.id);
  const flashFlag = req.session.flashFlag;
  delete req.session.flashFlag;
  res.render('dashboard', { user: req.session.user, posts, flag: flashFlag });
});

app.post('/posts/create', requireLogin, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.redirect('/dashboard');
  db.prepare('INSERT INTO posts (user_id, title, content, status) VALUES (?, ?, ?, ?)').run(
    req.session.user.id, title, content, 'draft'
  );
  res.redirect('/dashboard');
});

app.get('/admin/posts', requireLogin, (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('forbidden');
  }
  const pending = db.prepare("SELECT p.*, u.username FROM posts p JOIN users u ON u.id = p.user_id WHERE p.status = 'draft' ORDER BY p.id DESC").all();
  res.render('admin_posts', { user: req.session.user, pending });
});

app.post('/api/posts/:id/approve', requireLogin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  db.prepare("UPDATE posts SET status = 'approved' WHERE id = ?").run(id);

  if (post.title === 'flag-request') {
    req.session.flashFlag = FLAG;
    return res.json({ ok: true, message: 'Approved. A surprise awaits on your dashboard.', flag: FLAG });
  }
  res.json({ ok: true, message: 'Post approved.' });
});

app.listen(PORT, () => {
  console.log(`BAC lab listening on http://localhost:${PORT}`);
});

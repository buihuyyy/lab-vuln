const express = require('express');
const session = require('express-session');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const db = new Database(path.join(__dirname, 'app.db'));

const FLAG = 'buiih{parameter_tampering_trust_client}';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'frontend', 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

app.use(session({
  secret: 'super-insecure-lab-secret',
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
  const regs = db.prepare(`
    SELECT c.id, c.title, c.required_role
    FROM registrations r
    JOIN courses c ON c.id = r.course_id
    WHERE r.user_id = ?
  `).all(req.session.user.id);
  res.render('dashboard', { user: req.session.user, registrations: regs });
});

app.get('/courses', requireLogin, (req, res) => {
  const courses = db.prepare('SELECT * FROM courses').all();
  res.render('courses', { user: req.session.user, courses });
});


app.post('/courses/register', requireLogin, (req, res) => {
  const { courseId, accessLevel } = req.body;

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
  if (!course) {
    return res.status(404).render('result', {
      user: req.session.user,
      success: false,
      message: 'Course not found.',
      flag: null
    });
  }

  const effectiveRole = (accessLevel || 'user').toString().toLowerCase();

  if (course.required_role === 'admin' && effectiveRole !== 'admin') {
    return res.status(403).render('result', {
      user: req.session.user,
      success: false,
      message: 'This course requires admin access. You are not allowed to register.',
      flag: null
    });
  }

  const already = db.prepare('SELECT 1 FROM registrations WHERE user_id = ? AND course_id = ?')
    .get(req.session.user.id, course.id);
  if (!already) {
    db.prepare('INSERT INTO registrations (user_id, course_id) VALUES (?, ?)')
      .run(req.session.user.id, course.id);
  }

  let flag = null;
  if (course.required_role === 'admin' && req.session.user.role !== 'admin') {
    flag = FLAG;
  }

  res.render('result', {
    user: req.session.user,
    success: true,
    message: `Successfully registered for "${course.title}".`,
    flag
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Lab running at http://localhost:${PORT}`);
});

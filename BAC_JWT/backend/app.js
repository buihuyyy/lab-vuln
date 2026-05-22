const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3000;

const JWT_SECRET = 'lab-only-not-a-real-secret';
const FLAG = 'buiih{jwt_role_tampering_bac}';

const USERS = [
  { username: 'learner', password: 'learner123', role: 'user' },
  { username: 'admin',   password: 'admin123',   role: 'admin' }
];

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'frontend', 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));


function readToken(req) {
  const token = req.cookies.token;
  if (!token) return null;
  try {
    return jwt.decode(token); 
  } catch (e) {
    return null;
  }
}

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.render('login', { error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { username: user.username, role: user.role },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' }
  );
  res.cookie('token', token, { httpOnly: false });
  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

app.get('/dashboard', (req, res) => {
  const payload = readToken(req);
  if (!payload) return res.redirect('/login');
  res.render('dashboard', { user: payload });
});

app.get('/admin', (req, res) => {
  const payload = readToken(req);
  if (!payload) return res.redirect('/login');


  if (payload.role !== 'admin') {
    return res.status(403).render('forbidden', { user: payload });
  }

  res.render('admin', { user: payload, flag: FLAG });
});

app.listen(PORT, () => {
  console.log(`BAC JWT lab running at http://localhost:${PORT}`);
});

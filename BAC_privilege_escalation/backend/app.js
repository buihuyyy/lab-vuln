const express = require('express');
const session = require('express-session');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3000;
const FLAG = 'buiih{vertical_access_control_bypass}';

const db = new Database(':memory:');
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  );
  CREATE TABLE tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner TEXT,
    title TEXT,
    body TEXT
  );
`);

db.prepare(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`).run('student', 'student123', 'user');
db.prepare(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`).run('admin', 'admin123', 'admin');

const seedTickets = [
  ['student', 'Cannot connect to VPN', 'VPN client keeps disconnecting every 5 minutes.'],
  ['student', 'Printer offline', 'Office printer on 3rd floor is offline since Monday.'],
  ['admin',   'Internal: server migration', 'Plan migration of internal DB next weekend.'],
  ['alice',   'Email not syncing', 'Outlook does not sync since password reset.'],
  ['bob',     'Slow laptop', 'Laptop boot time > 5 minutes.']
];
const insertTicket = db.prepare(`INSERT INTO tickets (owner, title, body) VALUES (?, ?, ?)`);
for (const t of seedTickets) insertTicket.run(...t);


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'frontend', 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));
app.use(session({
  secret: 'ctf-bac-demo-secret',
  resave: false,
  saveUninitialized: false
}));


function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('forbidden', { user: req.session.user });
  }
  next();
}

app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

app.get('/login', (req, res) => {
  res.render('login', { user: req.session.user, error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const row = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  if (!row) {
    return res.render('login', { user: null, error: 'Invalid credentials' });
  }
  req.session.user = { id: row.id, username: row.username, role: row.role };
  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.get('/dashboard', requireLogin, (req, res) => {
  const user = req.session.user;
  const tickets = db.prepare('SELECT * FROM tickets WHERE owner = ?').all(user.username);
  res.render('dashboard', { user, tickets });
});

app.get('/ticket/:id', requireLogin, (req, res) => {
  const user = req.session.user;
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).send('Ticket not found');
  if (ticket.owner !== user.username && user.role !== 'admin') {
    return res.status(403).render('forbidden', { user });
  }
  res.render('ticket', { user, ticket });
});


app.get('/admin', requireAdmin, (req, res) => {
  const tickets = db.prepare('SELECT * FROM tickets').all();
  res.render('admin', { user: req.session.user, tickets });
});


app.get('/admin/report', requireLogin, (req, res) => {
  res.render('report', { user: req.session.user, flag: FLAG });
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    'User-agent: *\n' +
    'Disallow: /admin\n' +
    'Disallow: /admin/report\n'
  );
});

app.listen(PORT, () => {
  console.log(`[*] BAC lab running on http://localhost:${PORT}`);
});

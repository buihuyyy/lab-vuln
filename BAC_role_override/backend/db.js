const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'app.db'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    displayName TEXT,
    bio TEXT
  )`);

  const seed = (username, password, role, displayName, bio) => {
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
      if (!row) {
        db.run(
          'INSERT INTO users (username, password, role, displayName, bio) VALUES (?, ?, ?, ?, ?)',
          [username, password, role, displayName, bio]
        );
      }
    });
  };

  seed('huy', 'huy123', 'user', 'Huy', 'Just a regular user.');
  seed('admin', 'admin123', 'admin', 'Administrator', 'I run this place.');
});

module.exports = db;

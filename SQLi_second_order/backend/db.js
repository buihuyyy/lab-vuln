const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'app.db');

function init() {
  const fs = require('fs');
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      verdict TEXT,
      reviewed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS internal_flags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      flag TEXT NOT NULL
    );
  `);

  const row = db.prepare('SELECT COUNT(*) AS c FROM internal_flags').get();
  if (row.c === 0) {
    db.prepare('INSERT INTO internal_flags (name, flag) VALUES (?, ?)')
      .run('profile_review', 'buiih{s3c0nd_0rder_sqli_pwn3d}');
  }

  return db;
}

if (require.main === module) {
  init();
  console.log('DB initialized at', DB_PATH);
}

module.exports = { init, DB_PATH };

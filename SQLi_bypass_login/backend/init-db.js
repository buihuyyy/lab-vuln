const Database = require('better-sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'app.db');

if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
}

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

const adminPassword = crypto.randomBytes(18).toString('base64').replace(/[+/=]/g, '');

const seed = [
  ['guest',         'guest123',     'user'],
  ['staff',         'staff123',     'staff'],
  ['admin',         adminPassword,  'admin'],
  ['administrator', 'letmein',      'user'],
  ['root',          'toor2024',     'staff'],
  ['john',          'password1',    'user'],
  ['support',       'support2023',  'staff']
];

const insert = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
const tx = db.transaction((rows) => { for (const r of rows) insert.run(r); });
tx(seed);

console.log('[init-db] Database initialized at', DB_PATH);
console.log('[init-db] Admin password (kept inside container only):', adminPassword);

db.close();

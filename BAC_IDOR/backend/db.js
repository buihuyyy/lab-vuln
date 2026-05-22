const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'lab.db');
const firstRun = !fs.existsSync(DB_PATH);

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    amount TEXT NOT NULL,
    content TEXT NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );
`);

if (firstRun || db.prepare('SELECT COUNT(*) AS c FROM users').get().c === 0) {
  const insertUser = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
  const aliceId = insertUser.run('alice', 'alice123').lastInsertRowid;
  const bobId = insertUser.run('bob', 'bob123').lastInsertRowid;
  const charlieId = insertUser.run('charlie', 'charlie123').lastInsertRowid;

  const insertInvoice = db.prepare(
    'INSERT INTO invoices (owner_id, title, amount, content) VALUES (?, ?, ?, ?)'
  );

  insertInvoice.run(aliceId, 'Hosting bill - Jan', '$29.00', 'Monthly hosting fee for personal blog.');
  insertInvoice.run(aliceId, 'Domain renewal', '$12.00', 'Annual domain renewal for alice.dev.');

  insertInvoice.run(bobId, 'Office supplies', '$48.50', 'Pens, paper and a new keyboard.');
  insertInvoice.run(bobId, 'Cloud storage', '$9.99', 'Cloud backup subscription.');

  insertInvoice.run(
    bobId,
    'CONFIDENTIAL - internal',
    '$0.00',
    'Internal memo: project codename access token => buiih{horizontal_idor_lab}'
  );

  insertInvoice.run(charlieId, 'Coffee subscription', '$15.00', 'Monthly beans delivery.');
  insertInvoice.run(charlieId, 'Gym membership', '$35.00', 'Monthly gym fee.');

  console.log('[db] Seeded users and invoices.');
}

module.exports = db;

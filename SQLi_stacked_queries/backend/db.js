const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'app.db');

function resetAndInit() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE todos (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_public INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE user_access (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      can_view_secret INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE secret_todos (
      id INTEGER PRIMARY KEY,
      secret_content TEXT NOT NULL
    );

    CREATE TABLE access_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query_id TEXT,
      created_at TEXT
    );
  `);

  const insertTodo = db.prepare(
    'INSERT INTO todos (id, title, content, is_public) VALUES (?, ?, ?, ?)'
  );
  insertTodo.run(1, 'Buy milk', 'Remember to buy milk on the way home.', 1);
  insertTodo.run(2, 'Call mom', 'Call mom this weekend.', 1);
  insertTodo.run(3, 'Project ideas', 'Brainstorm Q3 side projects.', 1);
  insertTodo.run(4, 'Private notes', 'These notes are private. Nothing to see here.', 0);
  insertTodo.run(5, 'Vacation plan', 'Plan vacation to the coast.', 1);

  db.prepare(
    'INSERT INTO user_access (username, can_view_secret) VALUES (?, ?)'
  ).run('guest', 0);

  db.prepare(
    'INSERT INTO secret_todos (secret_content) VALUES (?)'
  ).run('buiih{st4ck3d_qu3r1es_change_st4te}');

  return db;
}

module.exports = { resetAndInit, DB_PATH };

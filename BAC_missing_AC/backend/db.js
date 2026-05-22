const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'ctf.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
if (userCount === 0) {
  const insertUser = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
  insertUser.run('member', 'member123', 'user');
  insertUser.run('moderator', 'mod123', 'admin');

  const insertPost = db.prepare('INSERT INTO posts (user_id, title, content, status) VALUES (?, ?, ?, ?)');
  insertPost.run(1, 'My first note', 'Just a regular draft from member.', 'draft');
  insertPost.run(2, 'Welcome', 'Admin welcome post.', 'approved');
  insertPost.run(1, 'flag-request', 'This post must be approved to reveal the flag.', 'draft');
}

module.exports = db;

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'app.db');

if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
}

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    discount INTEGER NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE secret_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flag TEXT NOT NULL
  );
`);

const insertCoupon = db.prepare('INSERT INTO coupons (code, discount, active) VALUES (?, ?, ?)');
insertCoupon.run('WELCOME10', 10, 1);
insertCoupon.run('SUMMER20', 20, 1);
insertCoupon.run('BLACKFRIDAY', 50, 0);
insertCoupon.run('VIP30', 30, 1);
insertCoupon.run('EXPIRED5', 5, 0);

const insertFlag = db.prepare('INSERT INTO secret_flags (flag) VALUES (?)');
insertFlag.run('buiih{t1m3_b1ind_sql1_m4st3r_2026}');

console.log('[seed] Database initialized at', DB_PATH);
db.close();

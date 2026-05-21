const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'app.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  DROP TABLE IF EXISTS shipments;
  DROP TABLE IF EXISTS flags;

  CREATE TABLE shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_code TEXT NOT NULL,
    status TEXT NOT NULL
  );

  CREATE TABLE flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flag TEXT NOT NULL
  );
`);

const shipments = [
  ['TRK1001', 'In transit'],
  ['TRK1002', 'Delivered'],
  ['TRK1003', 'Out for delivery'],
  ['TRK1004', 'Processing at warehouse'],
  ['TRK1005', 'Returned to sender'],
  ['TRK1006', 'Customs hold'],
  ['TRK1007', 'Delivered'],
  ['TRK1008', 'Awaiting pickup'],
  ['TRK1009', 'In transit'],
  ['TRK1010', 'Delivered']
];

const insertShip = db.prepare('INSERT INTO shipments (tracking_code, status) VALUES (?, ?)');
for (const s of shipments) insertShip.run(s[0], s[1]);

db.prepare('INSERT INTO flags (flag) VALUES (?)').run('buiih{bl1nd_b00l3an_sqli_m4st3r}');

console.log('Database initialized at', DB_PATH);
db.close();

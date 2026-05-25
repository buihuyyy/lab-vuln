const Database = require("better-sqlite3");

const db = new Database(":memory:");

db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer'
  );

  CREATE TABLE shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking TEXT NOT NULL,
    owner TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE archive (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_no TEXT NOT NULL,
    note TEXT NOT NULL,
    classification TEXT NOT NULL
  );
`);

const insertUser = db.prepare(
  "INSERT INTO users (username, password, role) VALUES (?, ?, ?)"
);
insertUser.run("huy", "learner123", "customer");
insertUser.run("linh", "summer-rain-22", "customer");

const insertShipment = db.prepare(
  "INSERT INTO shipments (tracking, owner, origin, destination, status, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
);
const now = new Date().toISOString();
insertShipment.run("PV-10241", "huy", "Hanoi", "Da Nang", "In transit", now);
insertShipment.run("PV-10242", "huy", "Ho Chi Minh", "Hanoi", "Delivered", now);
insertShipment.run("PV-10243", "huy", "Hai Phong", "Can Tho", "Processing", now);
insertShipment.run("PV-10244", "linh", "Hue", "Hanoi", "Delivered", now);

const insertArchive = db.prepare(
  "INSERT INTO archive (case_no, note, classification) VALUES (?, ?, ?)"
);
insertArchive.run(
  "ARC-0001",
  "Lost parcel claim closed without refund. Routine.",
  "internal"
);
insertArchive.run(
  "ARC-0002",
  "Customs hold released after fee paid. Routine.",
  "internal"
);
insertArchive.run(
  "ARC-VAULT",
  `Sealed vault entry. Access token: ${process.env.FLAG || "buiih{missing_flag}"}`,
  "restricted"
);

module.exports = db;

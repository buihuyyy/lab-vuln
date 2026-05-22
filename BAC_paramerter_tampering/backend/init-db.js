const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'app.db'));

db.exec(`
  DROP TABLE IF EXISTS registrations;
  DROP TABLE IF EXISTS courses;
  DROP TABLE IF EXISTS users;

  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
  );

  CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    required_role TEXT NOT NULL DEFAULT 'user'
  );

  CREATE TABLE registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );
`);

const insertUser = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
insertUser.run('student', 'student123', 'user');
insertUser.run('admin', 'admin123', 'admin');

const insertCourse = db.prepare('INSERT INTO courses (title, description, required_role) VALUES (?, ?, ?)');
insertCourse.run('Intro to Web Development', 'Learn HTML, CSS, and basic JavaScript.', 'user');
insertCourse.run('Python for Beginners', 'A friendly introduction to Python programming.', 'user');
insertCourse.run('Database Fundamentals', 'Relational databases and SQL basics.', 'user');
insertCourse.run('Admin Security Review', 'Internal admin-only course covering sensitive infrastructure review procedures.', 'admin');

console.log('Database initialized successfully.');

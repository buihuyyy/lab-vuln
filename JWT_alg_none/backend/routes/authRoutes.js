const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDb, saveDb } = require('../db');

const router = express.Router();

const SALT_ROUNDS = 10;
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username và password là bắt buộc.' });
    }

    const db = getDb();

    const existing = db.exec('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(409).json({ error: 'Username đã tồn tại.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    db.run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [
      username,
      hashedPassword,
      email || null,
    ]);
    saveDb();

    res.status(201).json({ message: 'Đăng ký thành công!' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Lỗi server.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username và password là bắt buộc.' });
    }

    const db = getDb();

    const result = db.exec('SELECT id, username, password FROM users WHERE username = ?', [username]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(401).json({ error: 'Sai username hoặc password.' });
    }

    const row = result[0].values[0];
    const user = { id: row[0], username: row[1], password: row[2] };

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Sai username hoặc password.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: COOKIE_MAX_AGE,
    });

    res.json({ message: 'Đăng nhập thành công!' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Lỗi server.' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Đã đăng xuất.' });
});

module.exports = router;

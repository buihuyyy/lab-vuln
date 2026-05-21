const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middleware/auth');
const { getDb, saveDb } = require('../db');

const router = express.Router();
const frontendDir = path.join(__dirname, '..', '..', 'frontend');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${req.user.id}_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép file ảnh: jpg, png, gif, webp.'));
    }
  },
});

router.get('/profile', verifyToken, (req, res) => {
  const db = getDb();
  const result = db.exec(
    'SELECT id, username, email, full_name, age, phone, website, avatar, created_at FROM users WHERE id = ?',
    [req.user.id]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: 'Không tìm thấy user.' });
  }

  const cols = result[0].columns;
  const vals = result[0].values[0];
  const user = {};
  cols.forEach((col, i) => {
    user[col] = vals[i];
  });

  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return res.sendFile(path.join(frontendDir, 'views', 'profile.html'));
  }

  res.json(user);
});

router.put('/profile', verifyToken, (req, res) => {
  const { full_name, age, phone, email, website } = req.body;
  const db = getDb();

  db.run(
    'UPDATE users SET full_name = ?, age = ?, phone = ?, email = ?, website = ? WHERE id = ?',
    [full_name || null, age || null, phone || null, email || null, website || null, req.user.id]
  );
  saveDb();

  res.json({ message: 'Cập nhật thành công!' });
});

router.post('/upload-avatar', verifyToken, (req, res) => {
  upload.single('avatar')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File quá lớn. Tối đa 2MB.' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Chưa chọn file ảnh.' });
    }

    const avatarPath = `/uploads/${req.file.filename}`;
    const db = getDb();

    const oldResult = db.exec('SELECT avatar FROM users WHERE id = ?', [req.user.id]);
    if (oldResult.length > 0 && oldResult[0].values.length > 0) {
      const oldAvatar = oldResult[0].values[0][0];
      if (oldAvatar) {
        const oldPath = path.join(uploadDir, path.basename(oldAvatar));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatarPath, req.user.id]);
    saveDb();

    res.json({ message: 'Upload avatar thành công!', avatar: avatarPath });
  });
});

module.exports = router;

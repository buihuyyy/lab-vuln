require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const { initDb } = require('./db');
const { verifyToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const frontendDir = path.join(__dirname, '..', 'frontend');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/public', express.static(path.join(frontendDir, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/', authRoutes);
app.use('/', userRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'views', 'index.html'));
});

app.get('/flag', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).send('Access denied: Bạn không phải admin. Yêu cầu bị chặn.');
  }
  const flagPath = path.join(__dirname, '..', 'flag.txt');
  res.sendFile(flagPath);
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(frontendDir, 'views', 'register.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(frontendDir, 'views', 'login.html'));
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Không thể khởi tạo database:', err);
    process.exit(1);
  });

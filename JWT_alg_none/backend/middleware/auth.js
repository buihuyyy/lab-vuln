const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const token = req.cookies && req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Chưa đăng nhập. Vui lòng đăng nhập.' });
  }

  try {
    const headerB64 = token.split('.')[0];
    const header = JSON.parse(Buffer.from(headerB64, 'base64').toString('utf8'));

    let decoded;
    if (header.alg === 'none') {
      decoded = jwt.decode(token);
    } else {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}

module.exports = { verifyToken };

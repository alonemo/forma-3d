const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Все поля обязательны' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Пароль минимум 6 символов' });
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email);
    if (existing)
      return res.status(409).json({ error: 'Email уже зарегистрирован' });
    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (name, email, password_hash) VALUES (?,?,?)'
    ).run(name, email, hash);
    const user = { id: result.lastInsertRowid, name, email, role: 'user' };
    res.status(201).json({ token: generateToken(user), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Все поля обязательны' });
  try {
    const user = db.prepare(
      'SELECT id, name, email, role, password_hash FROM users WHERE email=?'
    ).get(email);
    if (!user)
      return res.status(401).json({ error: 'Неверный email или пароль' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Неверный email или пароль' });
    const { password_hash, ...userWithoutHash } = user;
    res.json({ token: generateToken(userWithoutHash), user: userWithoutHash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const getMe = (req, res) => {
  const user = db.prepare(
    'SELECT id, name, email, role, created_at FROM users WHERE id=?'
  ).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json(user);
};

const updateMe = (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Имя и email обязательны' });
  const trimmedName = String(name).trim();
  const trimmedEmail = String(email).trim().toLowerCase();
  if (!trimmedName) return res.status(400).json({ error: 'Имя не может быть пустым' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
    return res.status(400).json({ error: 'Некорректный email' });
  try {
    const clash = db.prepare('SELECT id FROM users WHERE email=? AND id<>?').get(trimmedEmail, req.user.id);
    if (clash) return res.status(409).json({ error: 'Email уже занят' });
    db.prepare('UPDATE users SET name=?, email=? WHERE id=?').run(trimmedName, trimmedEmail, req.user.id);
    const user = db.prepare(
      'SELECT id, name, email, role, created_at FROM users WHERE id=?'
    ).get(req.user.id);
    res.json({ token: generateToken(user), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

module.exports = { register, login, getMe, updateMe };

jest.mock('../src/db');
const db = require('../src/db');
const bcrypt = require('bcryptjs');
const supertest = require('supertest');
const express = require('express');
const authRoutes = require('../src/routes/auth');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
const request = supertest(app);

beforeEach(() => db._reset());

describe('POST /api/auth/register', () => {
  test('создаёт пользователя и возвращает токен', async () => {
    // Нет дубликата
    db.prepare('SELECT id FROM users WHERE email=?').get.mockReturnValueOnce(undefined);
    // lastInsertRowid
    db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?,?,?)').run
      .mockReturnValueOnce({ lastInsertRowid: 1 });

    const res = await request.post('/api/auth/register')
      .send({ name: 'Иван', email: 'ivan@test.ru', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ email: 'ivan@test.ru', role: 'user' });
  });

  test('возвращает 400 при пустых полях', async () => {
    const res = await request.post('/api/auth/register').send({ email: 'a@b.ru' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/обязательны/i);
  });

  test('возвращает 400 при коротком пароле', async () => {
    const res = await request.post('/api/auth/register')
      .send({ name: 'A', email: 'a@b.ru', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/6 символов/i);
  });

  test('возвращает 409 если email уже занят', async () => {
    db.prepare('SELECT id FROM users WHERE email=?').get.mockReturnValueOnce({ id: 99 });

    const res = await request.post('/api/auth/register')
      .send({ name: 'Иван', email: 'exists@test.ru', password: 'secret123' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/зарегистрирован/i);
  });
});

describe('POST /api/auth/login', () => {
  test('возвращает токен при правильных данных', async () => {
    const hash = await bcrypt.hash('mypassword', 10);
    db.prepare('SELECT id, name, email, role, password_hash FROM users WHERE email=?').get
      .mockReturnValueOnce({ id: 1, name: 'Иван', email: 'ivan@test.ru', role: 'user', password_hash: hash });

    const res = await request.post('/api/auth/login')
      .send({ email: 'ivan@test.ru', password: 'mypassword' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  test('возвращает 401 при неверном пароле', async () => {
    const hash = await bcrypt.hash('correct', 10);
    db.prepare('SELECT id, name, email, role, password_hash FROM users WHERE email=?').get
      .mockReturnValueOnce({ id: 1, name: 'Иван', email: 'ivan@test.ru', role: 'user', password_hash: hash });

    const res = await request.post('/api/auth/login')
      .send({ email: 'ivan@test.ru', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/неверный/i);
  });

  test('возвращает 401 при несуществующем email', async () => {
    db.prepare('SELECT id, name, email, role, password_hash FROM users WHERE email=?').get
      .mockReturnValueOnce(undefined);

    const res = await request.post('/api/auth/login')
      .send({ email: 'ghost@test.ru', password: 'pass' });
    expect(res.status).toBe(401);
  });

  test('возвращает 400 при пустых полях', async () => {
    const res = await request.post('/api/auth/login').send({ email: 'a@b.ru' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  const jwt = require('jsonwebtoken');

  test('возвращает данные пользователя по токену', async () => {
    const token = jwt.sign({ id: 5, role: 'user' }, process.env.JWT_SECRET);
    db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id=?').get
      .mockReturnValueOnce({ id: 5, name: 'Петя', email: 'petya@test.ru', role: 'user', created_at: '2024-01-01' });

    const res = await request.get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 5, name: 'Петя' });
  });

  test('возвращает 401 без токена', async () => {
    const res = await request.get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

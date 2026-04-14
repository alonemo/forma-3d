jest.mock('../src/db');
const db = require('../src/db');
const jwt = require('jsonwebtoken');
const supertest = require('supertest');
const express = require('express');
const adminRoutes = require('../src/routes/admin');

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);
const request = supertest(app);

const adminToken = () => jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET);
const userToken  = () => jwt.sign({ id: 2, role: 'user' },  process.env.JWT_SECRET);

beforeEach(() => db._reset());

describe('Admin: доступ', () => {
  test('запрещает доступ обычному пользователю', async () => {
    const res = await request.get('/api/admin/orders')
      .set('Authorization', `Bearer ${userToken()}`);
    expect(res.status).toBe(403);
  });

  test('запрещает доступ без токена', async () => {
    const res = await request.get('/api/admin/orders');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/admin/orders', () => {
  test('возвращает все заказы', async () => {
    db.prepare.mockReturnValue({
      all: jest.fn()
        .mockReturnValueOnce([{
          id: 1, type: 'catalog', status: 'created', total_price: 850,
          cancel_reason: null, created_at: '2024-01-01',
          user_name: 'Иван', user_email: 'ivan@test.ru',
        }])
        .mockReturnValue([]),
      get: jest.fn(),
      run: jest.fn(),
    });

    const res = await request.get('/api/admin/orders')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({ user_name: 'Иван', status: 'created' });
  });

  test('фильтрует по статусу через query-параметр', async () => {
    db.prepare.mockReturnValue({
      all: jest.fn().mockReturnValue([]),
      get: jest.fn(),
      run: jest.fn(),
    });

    const res = await request.get('/api/admin/orders?status=ready')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('PATCH /api/admin/orders/:id/status', () => {
  test('переводит заказ created → in_progress', async () => {
    db.prepare.mockReturnValue({
      run: jest.fn().mockReturnValue({ changes: 1 }),
      get: jest.fn()
        .mockReturnValueOnce({ id: 1, status: 'created' })     // fetch to validate
        .mockReturnValue({ id: 1, status: 'in_progress' }),    // fetch after update
    });

    const res = await request.patch('/api/admin/orders/1/status')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
  });

  test('отменяет заказ с причиной (cancelled + cancel_reason)', async () => {
    db.prepare.mockReturnValue({
      run: jest.fn(),
      get: jest.fn()
        .mockReturnValueOnce({ id: 2, status: 'created' })
        .mockReturnValue({ id: 2, status: 'cancelled', cancel_reason: 'Клиент отказался' }),
    });

    const res = await request.patch('/api/admin/orders/2/status')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'cancelled', cancel_reason: 'Клиент отказался' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });

  test('возвращает 400 при полностью недопустимом статусе', async () => {
    const res = await request.patch('/api/admin/orders/1/status')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'deleted' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/недопустимый статус/i);
  });

  test('возвращает 400 при недопустимом переходе (ready → created)', async () => {
    db.prepare.mockReturnValue({
      run: jest.fn(),
      get: jest.fn().mockReturnValue({ id: 1, status: 'ready' }),
    });

    const res = await request.patch('/api/admin/orders/1/status')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'created' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/нельзя перевести/i);
  });

  test('возвращает 404 если заказ не найден', async () => {
    db.prepare.mockReturnValue({
      run: jest.fn(),
      get: jest.fn().mockReturnValue(undefined),
    });

    const res = await request.patch('/api/admin/orders/999/status')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(404);
  });
});

describe('POST /api/admin/products', () => {
  test('создаёт новый товар', async () => {
    const newProduct = { id: 1, name: 'Тест', price: 500, category: 'Декор', stock: 10 };
    db.prepare.mockReturnValue({
      run: jest.fn().mockReturnValue({ lastInsertRowid: 1 }),
      get: jest.fn().mockReturnValue(newProduct),
    });

    const res = await request.post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'Тест', price: 500, category: 'Декор', stock: 10 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Тест' });
  });

  test('возвращает 400 без названия или цены', async () => {
    const res = await request.post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ description: 'без названия' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/обязательн/i);
  });
});

describe('PUT /api/admin/products/:id', () => {
  test('обновляет существующий товар', async () => {
    const existing = { id: 1, name: 'Старое', description: '', price: 100, category: 'Декор', material: 'PLA', image_url: null, stock: 5 };
    const updated  = { ...existing, name: 'Новое', price: 200 };

    db.prepare.mockReturnValue({
      run: jest.fn(),
      get: jest.fn()
        .mockReturnValueOnce(existing)  // find existing
        .mockReturnValue(updated),      // return after update
    });

    const res = await request.put('/api/admin/products/1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'Новое', price: 200 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: 'Новое', price: 200 });
  });

  test('возвращает 404 если товар не существует', async () => {
    db.prepare.mockReturnValue({
      run: jest.fn(),
      get: jest.fn().mockReturnValue(undefined),
    });

    const res = await request.put('/api/admin/products/999')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'Несуществующий' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/admin/products/:id', () => {
  test('удаляет товар', async () => {
    db.prepare.mockReturnValue({ run: jest.fn() });

    const res = await request.delete('/api/admin/products/1')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/удалён/i);
  });
});

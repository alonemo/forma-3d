jest.mock('../src/db');
const db = require('../src/db');
const jwt = require('jsonwebtoken');
const supertest = require('supertest');
const express = require('express');
const orderRoutes = require('../src/routes/orders');

const app = express();
app.use(express.json());
app.use('/api/orders', orderRoutes);
const request = supertest(app);

const makeToken = (user = { id: 1, role: 'user' }) =>
  jwt.sign(user, process.env.JWT_SECRET);

beforeEach(() => db._reset());

describe('GET /api/orders', () => {
  test('возвращает заказы пользователя', async () => {
    db.prepare.mockReturnValue({
      all: jest.fn()
        .mockReturnValueOnce([{ id: 10, type: 'custom', status: 'created', total_price: null, created_at: '2024-01-01', description: 'тест' }])
        .mockReturnValue([]),
      get: jest.fn(),
      run: jest.fn(),
    });

    const res = await request.get('/api/orders')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: 10, type: 'custom' });
  });

  test('возвращает 401 без токена', async () => {
    const res = await request.get('/api/orders');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/orders/custom', () => {
  test('создаёт индивидуальный заказ', async () => {
    // transaction возвращает функцию, которая сразу вызывается
    db.transaction.mockImplementation(fn => () => fn());
    db.prepare.mockReturnValue({
      run: jest.fn().mockReturnValue({ lastInsertRowid: 42 }),
      get: jest.fn(),
      all: jest.fn(),
    });

    const res = await request.post('/api/orders/custom')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ description: 'Нужна деталь 50x50мм', material: 'PLA' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ orderId: 42 });
    expect(res.body.message).toMatch(/свяжемся/i);
  });

  test('возвращает 400 если нет description', async () => {
    const res = await request.post('/api/orders/custom')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ material: 'PLA' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/описание обязательно/i);
  });

  test('возвращает 401 без токена', async () => {
    const res = await request.post('/api/orders/custom')
      .send({ description: 'test' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/orders/catalog', () => {
  test('возвращает 400 при пустой корзине', async () => {
    const res = await request.post('/api/orders/catalog')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ items: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/пуста/i);
  });

  test('создаёт заказ из каталога', async () => {
    db.transaction.mockImplementation(fn => () => fn());
    const mockStmt = {
      get: jest.fn().mockReturnValue({ id: 1, price: 850, stock: 10 }),
      run: jest.fn().mockReturnValue({ lastInsertRowid: 55 }),
      all: jest.fn(),
    };
    db.prepare.mockReturnValue(mockStmt);

    const res = await request.post('/api/orders/catalog')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ items: [{ product_id: 1, quantity: 2 }] });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ orderId: 55 });
  });

  test('возвращает 400 если товара нет на складе', async () => {
    db.transaction.mockImplementation(fn => () => fn());
    db.prepare.mockReturnValue({
      get: jest.fn().mockReturnValue({ id: 1, price: 500, stock: 1 }),
      run: jest.fn(),
      all: jest.fn(),
    });

    const res = await request.post('/api/orders/catalog')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ items: [{ product_id: 1, quantity: 5 }] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/недостаточно/i);
  });
});

describe('PATCH /api/orders/:id/cancel', () => {
  test('отменяет заказ в статусе created', async () => {
    db.prepare.mockReturnValue({
      get: jest.fn().mockReturnValue({ id: 10, status: 'created', user_id: 1 }),
      run: jest.fn(),
      all: jest.fn(),
    });

    const res = await request.patch('/api/orders/10/cancel')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/отменён/i);
  });

  test('возвращает 400 если заказ уже in_progress', async () => {
    db.prepare.mockReturnValue({
      get: jest.fn().mockReturnValue({ id: 10, status: 'in_progress', user_id: 1 }),
      run: jest.fn(),
      all: jest.fn(),
    });

    const res = await request.patch('/api/orders/10/cancel')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/создан/i);
  });

  test('возвращает 404 если заказ не найден или чужой', async () => {
    db.prepare.mockReturnValue({
      get: jest.fn().mockReturnValue(undefined),
      run: jest.fn(),
      all: jest.fn(),
    });

    const res = await request.patch('/api/orders/99/cancel')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });

  test('возвращает 401 без токена', async () => {
    const res = await request.patch('/api/orders/1/cancel');
    expect(res.status).toBe(401);
  });
});

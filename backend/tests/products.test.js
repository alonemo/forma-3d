jest.mock('../src/db');
const db = require('../src/db');
const supertest = require('supertest');
const express = require('express');
const productRoutes = require('../src/routes/products');

const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);
const request = supertest(app);

const MOCK_PRODUCTS = [
  { id: 1, name: 'Органайзер', description: 'Для стола', price: 850, category: 'Органайзеры', material: 'PLA', stock: 10 },
  { id: 2, name: 'Подставка', description: 'Для ноутбука', price: 1200, category: 'Подставки', material: 'PETG', stock: 5 },
];

beforeEach(() => db._reset());

describe('GET /api/products', () => {
  test('возвращает список товаров', async () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue(MOCK_PRODUCTS) });

    const res = await request.get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({ name: 'Органайзер' });
  });

  test('передаёт category в WHERE', async () => {
    const mockAll = jest.fn().mockReturnValue([MOCK_PRODUCTS[0]]);
    db.prepare.mockReturnValue({ all: mockAll });

    const res = await request.get('/api/products?category=Органайзеры');
    expect(res.status).toBe(200);
    // SQL должен содержать category=?
    const sql = db.prepare.mock.calls[0][0];
    expect(sql).toContain('category=?');
    // первый аргумент .all() — 'Органайзеры'
    expect(mockAll.mock.calls[0]).toContain('Органайзеры');
  });

  test('передаёт поисковой запрос через LIKE', async () => {
    const mockAll = jest.fn().mockReturnValue([]);
    db.prepare.mockReturnValue({ all: mockAll });

    await request.get('/api/products?search=орган');
    const sql = db.prepare.mock.calls[0][0];
    expect(sql).toContain('LIKE ?');
    expect(mockAll.mock.calls[0]).toContain('%орган%');
  });

  test('возвращает пустой массив если нет товаров', async () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue([]) });
    const res = await request.get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/products/categories', () => {
  test('возвращает список уникальных категорий', async () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue([{ category: 'Декор' }, { category: 'Подставки' }]) });
    const res = await request.get('/api/products/categories');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(['Декор', 'Подставки']);
  });
});

describe('GET /api/products/materials', () => {
  test('возвращает список уникальных материалов', async () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue([{ material: 'ABS' }, { material: 'PLA' }]) });
    const res = await request.get('/api/products/materials');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(['ABS', 'PLA']);
  });
});

describe('GET /api/products/:id', () => {
  test('возвращает товар по id', async () => {
    db.prepare.mockReturnValue({ get: jest.fn().mockReturnValue(MOCK_PRODUCTS[0]) });
    const res = await request.get('/api/products/1');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, name: 'Органайзер' });
  });

  test('возвращает 404 если товар не найден', async () => {
    db.prepare.mockReturnValue({ get: jest.fn().mockReturnValue(undefined) });
    const res = await request.get('/api/products/999');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/не найден/i);
  });
});

'use strict';
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(process.env.DB_PATH || './data/print3d.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// ─── Хелпер для транзакций (аналог better-sqlite3's db.transaction) ───
db.transaction = (fn) => (...args) => {
  db.exec('BEGIN');
  try {
    const result = fn(...args);
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
};

// ─── Схема ────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user',
    created_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT,
    price       REAL NOT NULL,
    category    TEXT,
    material    TEXT,
    image_url   TEXT,
    stock       INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL CHECK (type IN ('catalog','custom')),
    status      TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created','in_progress','ready')),
    total_price REAL,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity   INTEGER NOT NULL,
    price      REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS custom_orders (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id         INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    description      TEXT NOT NULL,
    dimensions       TEXT,
    material         TEXT,
    contact_phone    TEXT,
    desired_deadline TEXT
  );
`);

// ─── Migration: add cancelled status + cancel_reason ──────────────────
try {
  const cols = db.prepare('PRAGMA table_info(orders)').all();
  if (!cols.some((c) => c.name === 'cancel_reason')) {
    db.exec('PRAGMA foreign_keys = OFF');
    db.exec(`
      CREATE TABLE orders_new (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type          TEXT NOT NULL CHECK (type IN ('catalog','custom')),
        status        TEXT NOT NULL DEFAULT 'created'
                        CHECK (status IN ('created','in_progress','ready','cancelled')),
        total_price   REAL,
        cancel_reason TEXT,
        created_at    TEXT DEFAULT (datetime('now')),
        updated_at    TEXT DEFAULT (datetime('now'))
      )
    `);
    db.exec(`
      INSERT INTO orders_new (id,user_id,type,status,total_price,cancel_reason,created_at,updated_at)
      SELECT id,user_id,type,status,total_price,NULL,created_at,updated_at FROM orders
    `);
    db.exec('DROP TABLE orders');
    db.exec('ALTER TABLE orders_new RENAME TO orders');
    db.exec('PRAGMA foreign_keys = ON');
  }
} catch (e) { console.error('Migration error:', e.message); }

// ─── Seed ─────────────────────────────────────────────────────────────
const adminExists = db.prepare("SELECT id FROM users WHERE email='admin@print3d.ru'").get();
if (!adminExists) {
  db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)'
  ).run(
    'Администратор',
    'admin@print3d.ru',
    '$2a$10$fkiJrYLtVtQIdwiICgLiD.06vnI8cpPK4VNxzCukEhNiHQNPBk3pe', // admin123
    'admin'
  );
}

const productCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
if (productCount === 0) {
  const ins = db.prepare(
    'INSERT INTO products (name, description, price, category, material, stock) VALUES (?,?,?,?,?,?)'
  );
  db.transaction(() => {
    [
      ['Органайзер для стола','Компактный настольный органайзер с отсеками для канцелярии, телефона и кабелей.',850,'Органайзеры','PLA',25],
      ['Подставка для ноутбука','Эргономичная подставка с регулируемым углом наклона. Улучшает вентиляцию.',1200,'Подставки','PETG',15],
      ['Кашпо для растений','Декоративное кашпо в скандинавском стиле с поддоном.',650,'Декор','PLA',30],
      ['Крепление для телефона в авто','Универсальное крепление на дефлектор воздуховода.',450,'Автотовары','ABS',40],
      ['Шестерёнка декоративная','Декоративный элемент в стиле стимпанк.',350,'Декор','PLA',50],
      ['Подставка для книг','Стильная подставка-держатель с нескользящим основанием.',780,'Подставки','PETG',20],
      ['Брелок с логотипом','Персонализированный брелок по вашему эскизу.',280,'Аксессуары','PLA',60],
      ['Корпус для Arduino','Защитный корпус для Arduino Uno с отверстиями для разъёмов.',550,'Электроника','ABS',18],
      ['Настенный крючок','Минималистичный настенный крючок для одежды.',320,'Органайзеры','PLA',45],
      ['Фигурка дракона','Детализированная фигурка в фэнтезийном стиле. Высота 15 см.',1500,'Фигурки','Resin',10],
      ['Геометрический светильник','Абажур с геометрическим узором для необычных световых эффектов.',2200,'Декор','PLA',8],
      ['Набор подставок','Набор из 10 декоративных подставок ярких цветов.',400,'Аксессуары','PLA',35],
    ].forEach(row => ins.run(...row));
  })();
}

module.exports = db;

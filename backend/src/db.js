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

// ─── Migration: add `colors` column to products ──────────────────────
try {
  const pcols = db.prepare('PRAGMA table_info(products)').all();
  if (!pcols.some((c) => c.name === 'colors')) {
    db.exec('ALTER TABLE products ADD COLUMN colors TEXT');
  }
} catch (e) { console.error('Products colors migration error:', e.message); }

// ─── Migration: replace dropped CREAM colour with FOREST in stored rows ──
try {
  const CREAM_OLD = '#e8dcc4';
  const FOREST_NEW = '#3d5a40';
  const rows = db.prepare("SELECT id, colors FROM products WHERE colors LIKE '%' || ? || '%'").all(CREAM_OLD);
  if (rows.length > 0) {
    const upd = db.prepare('UPDATE products SET colors=? WHERE id=?');
    db.transaction(() => {
      rows.forEach((r) => {
        try {
          const arr = JSON.parse(r.colors);
          if (!Array.isArray(arr)) return;
          const next = arr.map((c) => (c.toLowerCase() === CREAM_OLD ? FOREST_NEW : c));
          upd.run(JSON.stringify(next), r.id);
        } catch { /* skip malformed */ }
      });
    })();
  }
} catch (e) { console.error('Cream→Forest migration error:', e.message); }

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

// Seed products aligned with the ФОРМА design — categories/materials match
// the cached design mock at AppData/Local/Temp/design/design-project.
const C = {
  TERRACOTTA: '#b85c3c',
  OCHRE:      '#c8893b',
  FOREST:     '#3d5a40',
  CHARCOAL:   '#2b2118',
  SAND:       '#bfa888',
  OLIVE:      '#8a7a3f',
};

const FORMA_PRODUCTS = [
  { name: 'Ваза «Слой»',            description: 'Ваза с выраженной текстурой слоёв печати. Форма инспирирована гончарным кругом — высота увеличивается спиралью. Подходит для сухих букетов.', price: 2400, category: 'Декор',       material: 'PLA',          stock: 12, colors: [C.TERRACOTTA, C.FOREST, C.OCHRE] },
  { name: 'Фигурка «Пилигрим»',     description: 'Коллекционная фигурка из фотополимерной смолы. Детализация 25 микрон. Ручная пост-обработка и грунтовка.',                                   price: 1800, category: 'Фигурки',     material: 'Смола',        stock: 6,  colors: [C.CHARCOAL, C.SAND] },
  { name: 'Светильник «Гриб»',      description: 'Настольный светильник. Шляпка печатается vase mode — свет мягко рассеивается через полупрозрачные стенки.',                                  price: 4200, category: 'Светильники', material: 'PLA',          stock: 4,  colors: [C.FOREST, C.OCHRE] },
  { name: 'Органайзер «Соты»',      description: 'Модульный настольный органайзер. Соты соединяются магнитами (в комплекте). Соберите под свой стол.',                                         price: 1200, category: 'Органайзеры', material: 'PETG',         stock: 20, colors: [C.CHARCOAL, C.TERRACOTTA, C.FOREST] },
  { name: 'Подсвечник «Монолит»',   description: 'Массивный геометрический подсвечник под чайную свечу. Фактура грубых слоёв печати.',                                                        price: 1600, category: 'Декор',       material: 'PLA',          stock: 14, colors: [C.CHARCOAL, C.SAND] },
  { name: 'Планетарная передача',   description: 'Механическая игрушка-антистресс. 12 шестерёнок крутятся синхронно. Собирается без инструментов.',                                            price: 2200, category: 'Игрушки',     material: 'PETG',         stock: 10, colors: [C.OCHRE, C.OLIVE] },
  { name: 'Фигурка «Лиса»',         description: 'Стилизованная фигурка из филамента с древесными волокнами. После шлифовки напоминает резьбу по дереву.',                                    price: 1400, category: 'Фигурки',     material: 'PLA + дерево', stock: 8,  colors: [C.TERRACOTTA, C.OCHRE] },
  { name: 'Кашпо «Терраса»',        description: 'Кашпо с геометрическими уровнями. Дренажное отверстие и поддон в комплекте. Для суккулентов.',                                               price: 2800, category: 'Декор',       material: 'PLA',          stock: 9,  colors: [C.FOREST, C.TERRACOTTA, C.SAND] },
  { name: 'Головоломка «Куб»',      description: 'Механическая головоломка на 24 хода. Все детали печатаются за один проход — без склейки.',                                                  price: 1900, category: 'Игрушки',     material: 'PETG',         stock: 11, colors: [C.CHARCOAL, C.FOREST] },
  { name: 'Бра «Волна»',            description: 'Настенное бра с волнообразной формой. Источник света рассеивается через тонкие стенки.',                                                     price: 3600, category: 'Светильники', material: 'PLA',          stock: 5,  colors: [C.FOREST, C.OCHRE] },
  { name: 'Фигурка «Кит»',          description: 'Фигурка кита в минималистичной манере. Отпечатана из смолы, окрашена вручную в матовый графит.',                                             price: 2100, category: 'Фигурки',     material: 'Смола',        stock: 7,  colors: [C.CHARCOAL, C.SAND] },
  { name: 'Держатель наушников',    description: 'Подставка под наушники с кабель-менеджментом. Мягкая верхняя часть из TPU.',                                                                  price: 950,  category: 'Органайзеры', material: 'PLA',          stock: 18, colors: [C.CHARCOAL, C.TERRACOTTA] },

  // Expanded assortment
  { name: 'Ваза «Линза»',           description: 'Низкая широкая ваза с дугообразной формой. Хорошо смотрится с одиночными стеблями.',                                                        price: 2100, category: 'Декор',       material: 'PLA',          stock: 8,  colors: [C.TERRACOTTA, C.FOREST] },
  { name: 'Фигурка «Космонавт»',    description: 'Персонаж-космонавт из смолы, высотой 95 мм. Отдельные руки и подставка в комплекте.',                                                       price: 2600, category: 'Фигурки',     material: 'Смола',        stock: 5,  colors: [C.CHARCOAL, C.FOREST] },
  { name: 'Плафон «Кристалл»',      description: 'Подвесной плафон с гранёной поверхностью. Рассчитан на лампу E27.',                                                                         price: 3800, category: 'Светильники', material: 'PLA',          stock: 6,  colors: [C.FOREST, C.OCHRE, C.SAND] },
  { name: 'Флексный дракон',        description: 'Шарнирная игрушка-артикулируется в трёх сегментах. Печатается без склейки, гнётся сразу с принтера.',                                       price: 1700, category: 'Игрушки',     material: 'PLA',          stock: 14, colors: [C.TERRACOTTA, C.OCHRE, C.OLIVE] },
  { name: 'Подставка под ножи «Блок»', description: 'Компактный блок для 6 ножей с магнитным креплением. Устойчивая база с антискольз. накладками.',                                          price: 3200, category: 'Кухня',       material: 'PETG',         stock: 6,  colors: [C.CHARCOAL, C.SAND] },
  { name: 'Набор для специй',       description: 'Набор из четырёх пищевых банок с крышками-защёлками. Подходят для посудомойки.',                                                            price: 2400, category: 'Кухня',       material: 'PETG',         stock: 9,  colors: [C.FOREST, C.TERRACOTTA] },
  { name: 'Подставка под смартфон', description: 'Регулируемая подставка под смартфон или планшет. Поворотный шарнир фиксируется в любом положении.',                                          price: 1100, category: 'Гаджеты',     material: 'PETG',         stock: 16, colors: [C.CHARCOAL, C.OCHRE] },
  { name: 'Держатель для планшета', description: 'Рабочая подставка под планшет с кабель-каналом. Подходит для iPad 10–13 дюймов.',                                                           price: 1800, category: 'Гаджеты',     material: 'PLA',          stock: 11, colors: [C.CHARCOAL, C.OLIVE] },
];

const insertProduct = (p) =>
  db.prepare(
    'INSERT INTO products (name, description, price, category, material, stock, colors) VALUES (?,?,?,?,?,?,?)'
  ).run(p.name, p.description, p.price, p.category, p.material, p.stock, JSON.stringify(p.colors));

const seedProducts = () => {
  db.transaction(() => {
    FORMA_PRODUCTS.forEach((p) => insertProduct(p));
  })();
};

const productCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
if (productCount === 0) {
  seedProducts();
} else {
  // Re-seed if legacy (pre-design) categories are still present. Old products
  // are deleted only when no order_items reference them; otherwise left alone.
  const legacy = db.prepare(
    `SELECT COUNT(*) AS c FROM products
     WHERE category IN ('Подставки','Автотовары','Аксессуары','Электроника')`
  ).get().c;
  if (legacy > 0) {
    const safeToDelete = db.prepare(
      `SELECT id FROM products WHERE id NOT IN (SELECT product_id FROM order_items)`
    ).all().map((r) => r.id);
    if (safeToDelete.length > 0) {
      const placeholders = safeToDelete.map(() => '?').join(',');
      db.prepare(`DELETE FROM products WHERE id IN (${placeholders})`).run(...safeToDelete);
    }
    const remaining = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
    if (remaining === 0) seedProducts();
  }

  // Insert any FORMA_PRODUCTS items missing by name (idempotent expansion)
  const existingNames = new Set(db.prepare('SELECT name FROM products').all().map((r) => r.name));
  const missing = FORMA_PRODUCTS.filter((p) => !existingNames.has(p.name));
  if (missing.length > 0) {
    db.transaction(() => { missing.forEach((p) => insertProduct(p)); })();
  }

  // Backfill colors for legacy rows that predate the colors column
  const nullColors = db.prepare("SELECT id, name FROM products WHERE colors IS NULL OR colors=''").all();
  if (nullColors.length > 0) {
    const byName = new Map(FORMA_PRODUCTS.map((p) => [p.name, p.colors]));
    const palette = [C.TERRACOTTA, C.OCHRE, C.OLIVE, C.SAND, C.CHARCOAL, C.FOREST];
    const upd = db.prepare('UPDATE products SET colors=? WHERE id=?');
    db.transaction(() => {
      nullColors.forEach((row) => {
        const colors = byName.get(row.name) || [palette[Math.abs(row.id) % palette.length]];
        upd.run(JSON.stringify(colors), row.id);
      });
    })();
  }
}

module.exports = db;

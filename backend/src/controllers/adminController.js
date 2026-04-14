const db = require('../db');
const { toStr } = require('../utils');

// ─── Products ──────────────────────────────────────────────
const createProduct = (req, res) => {
  const { name, description, price, category, material, image_url, stock } = req.body;
  if (!name || !price)
    return res.status(400).json({ error: 'Название и цена обязательны' });
  try {
    const result = db.prepare(
      'INSERT INTO products (name, description, price, category, material, image_url, stock) VALUES (?,?,?,?,?,?,?)'
    ).run(name, description || '', price, category || null, material || null, image_url || null, stock || 0);
    const product = db.prepare('SELECT * FROM products WHERE id=?').get(result.lastInsertRowid);
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const updateProduct = (req, res) => {
  const { name, description, price, category, material, image_url, stock } = req.body;
  const existing = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Товар не найден' });
  try {
    db.prepare(`
      UPDATE products SET
        name=?, description=?, price=?, category=?, material=?, image_url=?, stock=?
      WHERE id=?
    `).run(
      name ?? existing.name, description ?? existing.description,
      price ?? existing.price, category ?? existing.category,
      material ?? existing.material, image_url ?? existing.image_url,
      stock ?? existing.stock, req.params.id
    );
    res.json(db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const deleteProduct = (req, res) => {
  db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
  res.json({ message: 'Товар удалён' });
};

// ─── Orders ────────────────────────────────────────────────
const getAllOrders = (req, res) => {
  const { status, type } = req.query;
  let sql = `
    SELECT o.id, o.type, o.status, o.total_price, o.cancel_reason, o.created_at,
           u.name AS user_name, u.email AS user_email,
           co.description, co.dimensions, co.material AS custom_material,
           co.contact_phone, co.desired_deadline
    FROM orders o
    JOIN users u ON u.id=o.user_id
    LEFT JOIN custom_orders co ON co.order_id=o.id
    WHERE 1=1`;
  const params = [];
  if (status) { sql += ' AND o.status=?'; params.push(status); }
  if (type)   { sql += ' AND o.type=?';   params.push(type); }
  sql += ' ORDER BY o.created_at DESC';

  try {
    const orders = db.prepare(sql).all(...params);
    const result = orders.map(order => {
      const base = {
        id: order.id, type: order.type, status: order.status,
        total_price: order.total_price, cancel_reason: toStr(order.cancel_reason),
        created_at: order.created_at,
        user_name: toStr(order.user_name), user_email: toStr(order.user_email),
      };
      if (order.type === 'catalog') {
        base.items = db.prepare(`
          SELECT oi.quantity, oi.price, p.name
          FROM order_items oi JOIN products p ON p.id=oi.product_id
          WHERE oi.order_id=?
        `).all(order.id).map(i => ({ ...i, name: toStr(i.name) }));
      } else {
        base.custom_detail = {
          description: toStr(order.description),
          dimensions: toStr(order.dimensions),
          material: toStr(order.custom_material),
          contact_phone: toStr(order.contact_phone),
          desired_deadline: toStr(order.desired_deadline),
        };
      }
      return base;
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const VALID_TRANSITIONS = {
  created:     ['in_progress', 'cancelled'],
  in_progress: ['ready', 'cancelled'],
  ready:       [],
  cancelled:   [],
};

const updateOrderStatus = (req, res) => {
  const { status, cancel_reason } = req.body;
  const allowed = ['created', 'in_progress', 'ready', 'cancelled'];
  if (!allowed.includes(status))
    return res.status(400).json({ error: 'Недопустимый статус' });

  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Заказ не найден' });

  if (!VALID_TRANSITIONS[order.status]?.includes(status))
    return res.status(400).json({ error: `Нельзя перевести из статуса "${order.status}" в "${status}"` });

  db.prepare("UPDATE orders SET status=?, cancel_reason=?, updated_at=datetime('now') WHERE id=?")
    .run(status, status === 'cancelled' ? (cancel_reason || null) : null, req.params.id);

  res.json(db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id));
};

module.exports = { createProduct, updateProduct, deleteProduct, getAllOrders, updateOrderStatus };

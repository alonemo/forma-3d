const db = require('../db');
const { toStr } = require('../utils');

const createCatalogOrder = (req, res) => {
  const { items } = req.body;
  if (!items || items.length === 0)
    return res.status(400).json({ error: 'Корзина пуста' });

  try {
    const result = db.transaction(() => {
      let total = 0;
      const enriched = [];
      for (const item of items) {
        const product = db.prepare('SELECT id, price, stock FROM products WHERE id=?').get(item.product_id);
        if (!product) throw Object.assign(new Error(`Товар ${item.product_id} не найден`), { status: 400 });
        if (product.stock < item.quantity) throw Object.assign(new Error('Недостаточно товара на складе'), { status: 400 });
        total += product.price * item.quantity;
        enriched.push({ ...item, price: product.price });
      }

      const orderId = db.prepare(
        'INSERT INTO orders (user_id, type, status, total_price) VALUES (?,?,?,?)'
      ).run(req.user.id, 'catalog', 'created', total).lastInsertRowid;

      for (const item of enriched) {
        db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?,?,?,?)')
          .run(orderId, item.product_id, item.quantity, item.price);
        db.prepare('UPDATE products SET stock = stock - ? WHERE id=?')
          .run(item.quantity, item.product_id);
      }
      return orderId;
    })();

    res.status(201).json({ message: 'Заказ создан', orderId: result });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Ошибка при создании заказа' });
  }
};

const createCustomOrder = (req, res) => {
  const { description, dimensions, material, contact_phone, desired_deadline } = req.body;
  if (!description)
    return res.status(400).json({ error: 'Описание обязательно' });

  try {
    const orderId = db.transaction(() => {
      const id = db.prepare(
        'INSERT INTO orders (user_id, type, status) VALUES (?,?,?)'
      ).run(req.user.id, 'custom', 'created').lastInsertRowid;
      db.prepare(
        'INSERT INTO custom_orders (order_id, description, dimensions, material, contact_phone, desired_deadline) VALUES (?,?,?,?,?,?)'
      ).run(id, description, dimensions || null, material || null, contact_phone || null, desired_deadline || null);
      return id;
    })();

    res.status(201).json({ message: 'Заказ отправлен, мы свяжемся с вами', orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const getUserOrders = (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.id, o.type, o.status, o.total_price, o.cancel_reason, o.created_at,
             co.description, co.dimensions, co.material AS custom_material,
             co.contact_phone, co.desired_deadline
      FROM orders o
      LEFT JOIN custom_orders co ON co.order_id = o.id
      WHERE o.user_id=?
      ORDER BY o.created_at DESC
    `).all(req.user.id);

    const result = orders.map(order => {
      const base = {
        id: order.id, type: order.type, status: order.status,
        total_price: order.total_price, cancel_reason: toStr(order.cancel_reason),
        created_at: order.created_at,
      };
      if (order.type === 'catalog') {
        base.items = db.prepare(`
          SELECT oi.quantity, oi.price, p.name, p.image_url
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

const cancelOrder = (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Заказ не найден' });
  if (order.status !== 'created')
    return res.status(400).json({ error: 'Отменить можно только заказ в статусе «Создан»' });

  db.prepare("UPDATE orders SET status='cancelled', updated_at=datetime('now') WHERE id=?").run(req.params.id);
  res.json({ message: 'Заказ отменён' });
};

module.exports = { createCatalogOrder, createCustomOrder, getUserOrders, cancelOrder };

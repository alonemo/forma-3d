const db = require('../db');

const hydrateProduct = (row) => {
  if (!row) return row;
  let colors = [];
  if (row.colors) {
    try { const parsed = JSON.parse(row.colors); if (Array.isArray(parsed)) colors = parsed; }
    catch { colors = []; }
  }
  return { ...row, colors };
};

const getProducts = (req, res) => {
  const { category, material, sort, order = 'asc', search } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category) { sql += ' AND category=?'; params.push(category); }
  if (material)  { sql += ' AND material=?'; params.push(material); }
  if (search)    { sql += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  const allowedSort = ['price', 'name', 'created_at'];
  const sortField = allowedSort.includes(sort) ? sort : 'created_at';
  const sortOrder = order === 'desc' ? 'DESC' : 'ASC';
  sql += ` ORDER BY ${sortField} ${sortOrder}`;

  try {
    res.json(db.prepare(sql).all(...params).map(hydrateProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const getProduct = (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Товар не найден' });
  res.json(hydrateProduct(product));
};

const getCategories = (req, res) => {
  const rows = db.prepare(
    'SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category'
  ).all();
  res.json(rows.map(r => r.category));
};

const getMaterials = (req, res) => {
  const rows = db.prepare(
    'SELECT DISTINCT material FROM products WHERE material IS NOT NULL ORDER BY material'
  ).all();
  res.json(rows.map(r => r.material));
};

module.exports = { getProducts, getProduct, getCategories, getMaterials, hydrateProduct };

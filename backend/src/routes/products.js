const router = require('express').Router();
const { getProducts, getProduct, getCategories, getMaterials } = require('../controllers/productController');

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/materials', getMaterials);
router.get('/:id', getProduct);

module.exports = router;

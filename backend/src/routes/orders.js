const router = require('express').Router();
const { createCatalogOrder, createCustomOrder, getUserOrders, cancelOrder } = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getUserOrders);
router.post('/catalog', createCatalogOrder);
router.post('/custom', createCustomOrder);
router.patch('/:id/cancel', cancelOrder);

module.exports = router;

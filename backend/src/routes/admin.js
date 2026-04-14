const router = require('express').Router();
const { createProduct, updateProduct, deleteProduct, getAllOrders, updateOrderStatus } = require('../controllers/adminController');
const { uploadImage } = require('../controllers/uploadController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);

router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);

router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.post('/products/upload-image', ...uploadImage);

module.exports = router;

const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const product = require('../controllers/productController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', asyncHandler(product.list));
router.post('/', authenticate, requireRole('admin'), asyncHandler(product.create));

module.exports = router;



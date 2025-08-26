const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const cart = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, asyncHandler(cart.getCart));
router.post('/', authenticate, asyncHandler(cart.addToCart));
router.delete('/:productId', authenticate, asyncHandler(cart.removeFromCart));

module.exports = router;



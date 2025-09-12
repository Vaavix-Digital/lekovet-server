const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const cart = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

// Get current user's cart (full product snapshots)
router.get('/', authenticate, asyncHandler(cart.getCart));

// Add product to cart: { productId, quantity?, selectedSize?, selectedColor? }
router.post('/', authenticate, asyncHandler(cart.addToCart));

// Remove product (optionally by selectedSize/selectedColor via query)
router.delete('/:productId', authenticate, asyncHandler(cart.removeFromCart));

module.exports = router;



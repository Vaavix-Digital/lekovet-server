const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const fav = require('../controllers/favoriteController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, asyncHandler(fav.getFavorites));
router.post('/', authenticate, asyncHandler(fav.addFavorite));
router.delete('/:productId', authenticate, asyncHandler(fav.removeFavorite));

module.exports = router;



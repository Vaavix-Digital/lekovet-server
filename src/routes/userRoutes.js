const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const userController = require('../controllers/userController');
const { authenticate, requireRole } = require('../middleware/auth');

// Protected routes - require authentication
router.use(authenticate);

// Get current user profile (any authenticated user)
router.get('/profile', asyncHandler(userController.getCurrentUser));

// Update current user profile (any authenticated user)
router.put('/profile', asyncHandler(userController.updateUser));

// Favorite routes (authenticated users only)
router.post('/favorites', asyncHandler(userController.addToFavorites));
router.delete('/removeFavorites/:productId', asyncHandler(userController.removeFromFavorites));
router.get('/favorites', asyncHandler(userController.getFavorites));
router.patch('/favorites/toggle', asyncHandler(userController.toggleFavorite));

// Address routes (authenticated users only)
router.post('/address', asyncHandler(userController.addAddress));
router.get('/getAddresses', asyncHandler(userController.getAddresses));
router.put('/addresses/:addressId', asyncHandler(userController.updateAddress));

// Admin only routes
router.get('/all', requireRole('admin'), asyncHandler(userController.getAllUsers));
router.get('/stats', requireRole('admin'), asyncHandler(userController.getUserStats));

// User management routes (Admin only)
router.get('/:id', requireRole('admin'), asyncHandler(userController.getUserById));
router.put('/:id', requireRole('admin'), asyncHandler(userController.updateUser));
router.delete('/:id', requireRole('admin'), asyncHandler(userController.deleteUser));
router.patch('/:id/role', requireRole('admin'), asyncHandler(userController.changeUserRole));

module.exports = router;

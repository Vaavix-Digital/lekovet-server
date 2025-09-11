const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const productController = require('../controllers/productController');
const { authenticate, requireRole } = require('../middleware/auth');

// Public routes
router.get('/', asyncHandler(productController.getAllProducts));
router.get('/new-arrivals', asyncHandler(productController.getNewArrivals));
router.get('/category/:category', asyncHandler(productController.getProductsByCategory));

// Admin route - must come before dynamic /:id
router.get(
    '/getAll',
    authenticate,
    requireRole('admin'),
    asyncHandler(productController.getProductsForAdmin)
);

router.post(
    '/comment/:id',
    authenticate, // optional: require users to be logged in
    asyncHandler(productController.addComment)
);

// Dynamic product ID route should come last
router.get('/:id', asyncHandler(productController.getProductById));

// Protected routes (require authentication and admin role)
router.post(
    '/create',
    authenticate,
    requireRole('admin'),
    ...productController.createProduct
);

router.put(
    '/update/:id',
    authenticate,
    requireRole('admin'),
    asyncHandler(productController.updateProduct)
);

router.delete(
    '/delete/:id',
    authenticate,
    requireRole('admin'),
    asyncHandler(productController.deleteProduct)
);

module.exports = router;

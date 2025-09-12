const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const feedbackController = require('../controllers/feedbackController');
const { authenticate, optionalAuthenticate, requireRole } = require('../middleware/auth');

// Public routes
router.get('/approved', asyncHandler(feedbackController.getApprovedFeedback));
router.post('/create', optionalAuthenticate, asyncHandler(feedbackController.createFeedback));

// Protected routes - require authentication
router.use(authenticate);

// Admin only routes
router.get('/', requireRole('admin'), asyncHandler(feedbackController.getAllFeedback));
router.get('/stats', requireRole('admin'), asyncHandler(feedbackController.getFeedbackStats));
router.patch('/:id/status', requireRole('admin'), asyncHandler(feedbackController.updateFeedbackStatus));

router.delete('/:id', requireRole('admin'), asyncHandler(feedbackController.deleteFeedback));

module.exports = router;

const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../controllers/authController');

router.post('/register', asyncHandler(auth.register));
router.post('/login', asyncHandler(auth.login));
router.post('/google', asyncHandler(auth.googleLogin));

module.exports = router;



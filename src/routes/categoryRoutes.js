const router = require('express').Router();
const category = require('../controllers/categoryController');

router.get('/', category.list);

module.exports = router;



const { products, getNextProductId } = require('../models/db');

const VALID_CATEGORIES = ['men', 'women', 'joggers', 'combos'];

exports.list = (req, res) => {
	const { category } = req.query;
	const list = category ? products.filter(p => p.category === category) : products;
	res.json(list);
};

exports.create = (req, res) => {
	const { name, price, category } = req.body || {};
	if (!name || typeof price !== 'number' || !category) {
		return res.status(400).json({ error: 'name, price(number), category required' });
	}
	if (!VALID_CATEGORIES.includes(category)) {
		return res.status(400).json({ error: `category must be one of ${VALID_CATEGORIES.join(', ')}` });
	}
	const product = { id: getNextProductId(), name, price, category };
	products.push(product);
	return res.status(201).json(product);
};



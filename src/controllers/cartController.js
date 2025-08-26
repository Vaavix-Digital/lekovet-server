const { userCarts } = require('../models/db');

exports.getCart = (req, res) => {
	const cart = userCarts.get(req.user.id) || [];
	res.json(cart);
};

exports.addToCart = (req, res) => {
	const { productId, quantity } = req.body || {};
	if (typeof productId !== 'number' || typeof quantity !== 'number' || quantity <= 0) {
		return res.status(400).json({ error: 'productId(number) and quantity(>0) required' });
	}
	const cart = userCarts.get(req.user.id) || [];
	const existing = cart.find(i => i.productId === productId);
	if (existing) existing.quantity += quantity; else cart.push({ productId, quantity });
	userCarts.set(req.user.id, cart);
	res.status(201).json(cart);
};

exports.removeFromCart = (req, res) => {
	const productId = Number(req.params.productId);
	const cart = userCarts.get(req.user.id) || [];
	const next = cart.filter(i => i.productId !== productId);
	userCarts.set(req.user.id, next);
	res.json(next);
};



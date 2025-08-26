const { userFavorites } = require('../models/db');

exports.getFavorites = (req, res) => {
	const favs = userFavorites.get(req.user.id) || [];
	res.json(favs);
};

exports.addFavorite = (req, res) => {
	const { productId } = req.body || {};
	if (typeof productId !== 'number') return res.status(400).json({ error: 'productId(number) required' });
	const favs = userFavorites.get(req.user.id) || [];
	if (!favs.includes(productId)) favs.push(productId);
	userFavorites.set(req.user.id, favs);
	res.status(201).json(favs);
};

exports.removeFavorite = (req, res) => {
	const productId = Number(req.params.productId);
	const favs = userFavorites.get(req.user.id) || [];
	const next = favs.filter(id => id !== productId);
	userFavorites.set(req.user.id, next);
	res.json(next);
};



const User = require('../models/user.model');
const Product = require('../models/product.model');

exports.getCart = async (req, res) => {
	const user = await User.findById(req.user.id).select('cart');
	if (!user) return res.status(404).json({ error: 'User not found' });
	return res.json({ items: user.cart, totalItems: user.cart.reduce((n, i) => n + i.quantity, 0) });
};

exports.addToCart = async (req, res) => {
	const { productId, quantity, selectedSize, selectedColor } = req.body || {};
	if (!productId) return res.status(400).json({ error: 'productId required' });
	const qty = Number(quantity || 1);
	if (!Number.isFinite(qty) || qty <= 0) return res.status(400).json({ error: 'quantity must be > 0' });

	const product = await Product.findById(productId);
	if (!product) return res.status(404).json({ error: 'Product not found' });

	const snapshot = {
		_id: product._id,
		id: product.id,
		name: product.name,
		brand: product.brand,
		category: product.category,
		subCategory: product.subCategory,
		price: { currency: product.price?.currency, amount: product.price?.amount },
		media: { images: product.media?.images || [], video: product.media?.video || null },
		stock: product.stock,
		rating: { average: product.rating?.average || 0, count: product.rating?.count || 0 }
	};

	const user = await User.findById(req.user.id).select('cart');
	if (!user) return res.status(404).json({ error: 'User not found' });

	// If same product and same options exist, just increment quantity
	const existing = user.cart.find(i => i.product && String(i.product._id) === String(product._id)
		&& i.selectedSize === (selectedSize || undefined)
		&& i.selectedColor === (selectedColor || undefined));
	if (existing) {
		existing.quantity += qty;
	} else {
		user.cart.push({
			product: snapshot,
			quantity: qty,
			selectedSize,
			selectedColor,
			unitPrice: snapshot.price?.amount || 0
		});
	}

	await user.save();
	return res.status(201).json({ items: user.cart });
};

exports.removeFromCart = async (req, res) => {
	const productId = req.params.productId;
	if (!productId) return res.status(400).json({ error: 'productId param required' });
	const { selectedSize, selectedColor } = req.query || {};

	const user = await User.findById(req.user.id).select('cart');
	if (!user) return res.status(404).json({ error: 'User not found' });

	user.cart = user.cart.filter(i => !(String(i.product?._id) === String(productId)
		&& (selectedSize ? i.selectedSize === selectedSize : true)
		&& (selectedColor ? i.selectedColor === selectedColor : true)));

	await user.save();
	return res.json({ items: user.cart });
};


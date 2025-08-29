const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
	productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
	quantity: { type: Number, default: 1 },
	price: { type: Number, required: true },
	variant: { type: String }
}, { timestamps: true });

module.exports = cartItemSchema;

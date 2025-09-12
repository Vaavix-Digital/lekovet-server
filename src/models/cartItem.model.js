const mongoose = require('mongoose');

// Snapshot of the product at add-to-cart time
const productSnapshotSchema = new mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
	id: { type: String },
	name: { type: String },
	brand: { type: String },
	category: { type: String },
	subCategory: { type: String },
	price: {
		currency: { type: String },
		amount: { type: Number }
	},
	media: {
		images: [{ type: String }],
		video: { type: String }
	},
	stock: { type: Number },
	rating: {
		average: { type: Number },
		count: { type: Number }
	}
}, { _id: false });

const cartItemSchema = new mongoose.Schema({
	product: { type: productSnapshotSchema, required: true },
	quantity: { type: Number, default: 1, min: 1 },
	selectedSize: { type: String },
	selectedColor: { type: String },
	unitPrice: { type: Number, required: true }
}, { timestamps: true });

module.exports = cartItemSchema;

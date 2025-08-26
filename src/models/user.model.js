const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	country: { type: String, required: true },
	companyName: { type: String },
	streetAddress: { type: String, required: true },
	aptSuite: { type: String },
	city: { type: String, required: true },
	state: { type: String, required: true },
	postalCode: { type: String, required: true },
	phone: { type: String, required: true },
	deliveryInstruction: { type: String },
	label: { type: String, enum: ['Home', 'Office', 'Other'], default: 'Home' },
	isDefaultShipping: { type: Boolean, default: false },
	isDefaultBilling: { type: Boolean, default: false }
}, { timestamps: true });

const cartItemSchema = new mongoose.Schema({
	productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
	quantity: { type: Number, default: 1 },
	price: { type: Number, required: true },
	variant: { type: String }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
	name: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	phone: { type: String },
	password: { type: String, required: function () { return this.provider === 'local'; } },
	provider: { type: String, enum: ['local', 'google'], default: 'local' },
	googleId: { type: String },
	role: { type: String, enum: ['user', 'admin'], default: 'user' },
	addresses: [addressSchema],
	favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
	cart: [cartItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);



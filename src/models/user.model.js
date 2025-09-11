const mongoose = require('mongoose');
const addressSchema = require('./address.model');
const cartItemSchema = require('./cartItem.model');

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



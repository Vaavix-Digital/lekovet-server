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
	// label: { type: String, enum: ['Home', 'Office', 'Other'], default: 'Home' },
	isDefaultShipping: { type: Boolean, default: false },
	isDefaultBilling: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = addressSchema;

const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: false // Optional - allows anonymous feedback
	},
	name: { 
		type: String, 
		required: true,
		trim: true
	},
	rating: { 
		type: Number, 
		required: true,
		min: 1,
		max: 5
	},
	text: { 
		type: String, 
		required: true,
		trim: true,
		maxlength: 1000
	},
	status: {
		type: String,
		enum: ['pending', 'approved', 'rejected'],
		default: 'pending'
	},
	adminResponse: {
		type: String,
		trim: true
	},
	respondedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	respondedAt: {
		type: Date
	}
}, { timestamps: true });

// Index for better query performance
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);

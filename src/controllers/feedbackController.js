const Feedback = require('../models/feedback.model');

// Get approved feedback for users (Public)
exports.getApprovedFeedback = async (req, res) => {
	try {
		const { 
			page = 1, 
			limit = 10, 
			rating, 
			sortBy = 'createdAt', 
			sortOrder = 'desc' 
		} = req.query;

		// Build query - only approved feedback
		const query = { status: 'approved' };
		if (rating) {
			query.rating = parseInt(rating);
		}

		// Build sort object
		const sort = {};
		sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

		// Execute query with pagination
		const feedback = await Feedback.find(query)
			.populate('user', 'name')
			.select('name rating text createdAt user')
			.sort(sort)
			.limit(limit * 1)
			.skip((page - 1) * limit)
			.lean();

		// Get total count for pagination
		const total = await Feedback.countDocuments(query);

		return res.json({
			success: true,
			data: feedback,
			pagination: {
				currentPage: parseInt(page),
				totalPages: Math.ceil(total / limit),
				totalFeedback: total,
				hasNextPage: page * limit < total,
				hasPrevPage: page > 1
			}
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to fetch feedback',
			message: error.message
		});
	}
};

// Create new feedback
exports.createFeedback = async (req, res) => {
	try {
		const { name, rating, text } = req.body;

		// Validate required fields
		if (!name || !rating || !text) {
			return res.status(400).json({
				success: false,
				error: 'Missing required fields: name, rating, text'
			});
		}

		// Validate rating range
		if (rating < 1 || rating > 5) {
			return res.status(400).json({
				success: false,
				error: 'Rating must be between 1 and 5'
			});
		}

		// Create feedback object
		const feedbackData = {
			name: name.trim(),
			rating: parseInt(rating),
			text: text.trim()
		};

		// Add user ID if authenticated (from middleware)
		if (req.user && req.user.id) {
			feedbackData.user = req.user.id;
		}

		const feedback = new Feedback(feedbackData);
		await feedback.save();

		return res.status(201).json({
			success: true,
			message: 'Feedback submitted successfully',
			data: feedback
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to create feedback',
			message: error.message
		});
	}
};

// Get all feedback (Admin only)
exports.getAllFeedback = async (req, res) => {
	try {
		const { 
			page = 1, 
			limit = 10, 
			status, 
			rating, 
			sortBy = 'createdAt', 
			sortOrder = 'desc' 
		} = req.query;

		// Build query
		const query = {};
		if (status) {
			query.status = status;
		}
		if (rating) {
			query.rating = parseInt(rating);
		}

		// Build sort object
		const sort = {};
		sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

		// Execute query with pagination
		const feedback = await Feedback.find(query)
			.populate('respondedBy', 'nam')
			.sort(sort)
			.limit(limit * 1)
			.skip((page - 1) * limit)
			.lean();

		// Get total count for pagination
		const total = await Feedback.countDocuments(query);

		return res.json({
			success: true,
			data: feedback,
			pagination: {
				currentPage: parseInt(page),
				totalPages: Math.ceil(total / limit),
				totalFeedback: total,
				hasNextPage: page * limit < total,
				hasPrevPage: page > 1
			}
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to fetch feedback',
			message: error.message
		});
	}
};


// Update feedback status (Admin only)
exports.updateFeedbackStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { status } = req.body;

		if (!['pending', 'approved', 'rejected'].includes(status)) {
			return res.status(400).json({
				success: false,
				error: 'Invalid status. Must be "pending", "approved", or "rejected"'
			});
		}

		const feedback = await Feedback.findByIdAndUpdate(
			id,
			{ status },
			{ new: true, runValidators: true }
		).populate('respondedBy', 'nam');

		if (!feedback) {
			return res.status(404).json({
				success: false,
				error: 'Feedback not found'
			});
		}

		return res.json({
			success: true,
			message: 'Feedback status updated successfully',
			data: feedback
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to update feedback status',
			message: error.message
		});
	}
};



// Delete feedback (Admin only)
exports.deleteFeedback = async (req, res) => {
	try {
		const { id } = req.params;

		const feedback = await Feedback.findByIdAndDelete(id);

		if (!feedback) {
			return res.status(404).json({
				success: false,
				error: 'Feedback not found'
			});
		}

		return res.json({
			success: true,
			message: 'Feedback deleted successfully'
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to delete feedback',
			message: error.message
		});
	}
};

// Get feedback statistics (Admin only)
exports.getFeedbackStats = async (req, res) => {
	try {
		const totalFeedback = await Feedback.countDocuments();
		const pendingFeedback = await Feedback.countDocuments({ status: 'pending' });
		const approvedFeedback = await Feedback.countDocuments({ status: 'approved' });
		const rejectedFeedback = await Feedback.countDocuments({ status: 'rejected' });

		// Get average rating
		const ratingStats = await Feedback.aggregate([
			{
				$group: {
					_id: null,
					averageRating: { $avg: '$rating' },
					totalRatings: { $sum: 1 }
				}
			}
		]);

		// Get rating distribution
		const ratingDistribution = await Feedback.aggregate([
			{
				$group: {
					_id: '$rating',
					count: { $sum: 1 }
				}
			},
			{
				$sort: { _id: 1 }
			}
		]);

		// Get recent feedback (last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		const recentFeedback = await Feedback.countDocuments({
			createdAt: { $gte: thirtyDaysAgo }
		});

		return res.json({
			success: true,
			data: {
				totalFeedback,
				pendingFeedback,
				approvedFeedback,
				rejectedFeedback,
				averageRating: ratingStats.length > 0 ? ratingStats[0].averageRating : 0,
				ratingDistribution,
				recentFeedback
			}
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to fetch feedback statistics',
			message: error.message
		});
	}
};

const User = require('../models/user.model');
const Product = require('../models/product.model');

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
	try {
		const { page = 1, limit = 10, search, role, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
		
		// Build query
		const query = {};
		if (search) {
			query.$or = [
				{ name: { $regex: search, $options: 'i' } },
				{ email: { $regex: search, $options: 'i' } }
			];
		}
		if (role) {
			query.role = role;
		}

		// Build sort object
		const sort = {};
		sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

		// Execute query with pagination
		let users = await User.find(query)
			.select('_id name email provider createdAt updatedAt lastLogin')
			.sort(sort)
			.limit(limit * 1)
			.skip((page - 1) * limit)
			.lean();

		// Format dates into readable format
		users = users.map(u => ({
			...u,
			createdAt: new Date(u.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
			updatedAt: new Date(u.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
			lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : null
		}));

		// Get total count for pagination
		const total = await User.countDocuments(query);

		return res.json({
			success: true,
			data: users,
			pagination: {
				currentPage: parseInt(page),
				totalPages: Math.ceil(total / limit),
				totalUsers: total,
				hasNextPage: page * limit < total,
				hasPrevPage: page > 1
			}
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to fetch users',
			message: error.message
		});
	}
};

// Get user by ID
exports.getUserById = async (req, res) => {
	try {
		const { id } = req.params;
		const user = await User.findById(id).select('-password -__v');
		
		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'User not found'
			});
		}

		return res.json({
			success: true,
			data: user
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to fetch user',
			message: error.message
		});
	}
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('-password -__v');
		
		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'User not found'
			});
		}

		return res.json({
			success: true,
			data: user
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to fetch user profile',
			message: error.message
		});
	}
};

// Update user profile
exports.updateUser = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, phone, addresses } = req.body;

		// Check if user exists
		const user = await User.findById(id);
		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'User not found'
			});
		}

		// Only allow users to update their own profile or admin to update any profile
		if (req.user.role !== 'admin' && req.user.id !== id) {
			return res.status(403).json({
				success: false,
				error: 'Not authorized to update this user'
			});
		}

		// Update fields
		const updateData = {};
		if (name) updateData.name = name;
		if (phone) updateData.phone = phone;
		if (addresses) updateData.addresses = addresses;

		const updatedUser = await User.findByIdAndUpdate(
			id,
			updateData,
			{ new: true, runValidators: true }
		).select('-password -__v');

		return res.json({
			success: true,
			data: updatedUser,
			message: 'User updated successfully'
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to update user',
			message: error.message
		});
	}
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
	try {
		const { id } = req.params;

		// Check if user exists
		const user = await User.findById(id);
		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'User not found'
			});
		}

		// Prevent admin from deleting themselves
		if (req.user.id === id) {
			return res.status(400).json({
				success: false,
				error: 'Cannot delete your own account'
			});
		}

		await User.findByIdAndDelete(id);

		return res.json({
			success: true,
			message: 'User deleted successfully'
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to delete user',
			message: error.message
		});
	}
};

// Change user role (Admin only)
exports.changeUserRole = async (req, res) => {
	try {
		const { id } = req.params;
		const { role } = req.body;

		if (!['user', 'admin'].includes(role)) {
			return res.status(400).json({
				success: false,
				error: 'Invalid role. Must be "user" or "admin"'
			});
		}

		// Check if user exists
		const user = await User.findById(id);
		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'User not found'
			});
		}

		// Prevent admin from changing their own role
		if (req.user.id === id) {
			return res.status(400).json({
				success: false,
				error: 'Cannot change your own role'
			});
		}

		const updatedUser = await User.findByIdAndUpdate(
			id,
			{ role },
			{ new: true, runValidators: true }
		).select('-password -__v');

		return res.json({
			success: true,
			data: updatedUser,
			message: 'User role updated successfully'
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to update user role',
			message: error.message
		});
	}
};

// Get user statistics (Admin only)
exports.getUserStats = async (req, res) => {
	try {
		const totalUsers = await User.countDocuments();
		const adminUsers = await User.countDocuments({ role: 'admin' });
		const regularUsers = await User.countDocuments({ role: 'user' });
		const googleUsers = await User.countDocuments({ provider: 'google' });
		const localUsers = await User.countDocuments({ provider: 'local' });

		// Get users created in last 30 days
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		const recentUsers = await User.countDocuments({
			createdAt: { $gte: thirtyDaysAgo }
		});

		return res.json({
			success: true,
			data: {
				totalUsers,
				adminUsers,
				regularUsers,
				googleUsers,
				localUsers,
				recentUsers
			}
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to fetch user statistics',
			message: error.message
		});
	}
};

// Add product to favorites
exports.addToFavorites = async (req, res) => {
	try {
		const { productId } = req.body;
		const userId = req.user.id;

		// Validate product exists
		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({
				success: false,
				error: 'Product not found'
			});
		}

		// Add to favorites (using $addToSet to prevent duplicates)
		await User.findByIdAndUpdate(
			userId,
			{ $addToSet: { favorites: productId } },
			{ new: true }
		);

		return res.json({
			success: true,
			message: 'Product added to favorites successfully'
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to add product to favorites',
			message: error.message
		});
	}
};

// Remove product from favorites
exports.removeFromFavorites = async (req, res) => {
	try {
		const { productId } = req.params;
		const userId = req.user.id;

		// Check if product is in favorites
		const user = await User.findById(userId);
		if (!user.favorites.includes(productId)) {
			return res.status(400).json({
				success: false,
				error: 'Product not in favorites'
			});
		}

		// Remove from favorites
		await User.findByIdAndUpdate(
			userId,
			{ $pull: { favorites: productId } },
			{ new: true }
		);

		return res.json({
			success: true,
			message: 'Product removed from favorites successfully'
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to remove product from favorites',
			message: error.message
		});
	}
};

// Get user's favorite products
exports.getFavorites = async (req, res) => {
	try {
		const userId = req.user.id;
		const { page = 1, limit = 10 } = req.query;

		const user = await User.findById(userId)
			.populate({
				path: 'favorites',
				select: 'name price images category brand inStock',
				options: {
					limit: limit * 1,
					skip: (page - 1) * limit
				}
			});

		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'User not found'
			});
		}

		// Get total count of favorites for pagination
		const totalFavorites = user.favorites.length;

		return res.json({
			success: true,
			data: user.favorites,
			pagination: {
				currentPage: parseInt(page),
				totalPages: Math.ceil(totalFavorites / limit),
				totalFavorites,
				hasNextPage: page * limit < totalFavorites,
				hasPrevPage: page > 1
			}
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to fetch favorites',
			message: error.message
		});
	}
};

// Toggle favorite (add if not exists, remove if exists)
exports.toggleFavorite = async (req, res) => {
	try {
		const { productId } = req.body;
		const userId = req.user.id;

		// Validate product exists
		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({
				success: false,
				error: 'Product not found'
			});
		}

		const user = await User.findById(userId);
		const isInFavorites = user.favorites.includes(productId);

		let updateOperation;
		let message;

		if (isInFavorites) {
			// Remove from favorites
			updateOperation = { $pull: { favorites: productId } };
			message = 'Product removed from favorites successfully';
		} else {
			// Add to favorites (using $addToSet to prevent duplicates)
			updateOperation = { $addToSet: { favorites: productId } };
			message = 'Product added to favorites successfully';
		}

		await User.findByIdAndUpdate(userId, updateOperation, { new: true });

		return res.json({
			success: true,
			message,
			isInFavorites: !isInFavorites
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to toggle favorite',
			message: error.message
		});
	}
};

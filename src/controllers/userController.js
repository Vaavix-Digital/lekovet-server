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
// const Product = require('../models/product.model');
// const User = require('../models/user.model');

exports.getFavorites = async (req, res) => {
	try {
		const userId = req.user.id;
		const { page = 1, limit = 10 } = req.query;

		const user = await User.findById(userId).select('favorites');

		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'User not found'
			});
		}

		// Total favorites count
		const totalFavorites = user.favorites.length;

		// Fetch product docs for those IDs
		const favoriteProducts = await Product.find({
			_id: { $in: user.favorites }
		})
			.skip((page - 1) * limit)
			.limit(parseInt(limit));


			const formattedProducts = favoriteProducts.map(prod => ({
				_id: prod._id,
				name: prod.name,
				subCategory: prod.subCategory,
				category: prod.category,
				price: prod.price.amount, // only the number
				image: prod.colors.length > 0 ? prod.colors[0].image : null
			}));

		return res.json({
			success: true,
			data: formattedProducts, // full product docs
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

// Add address to user
exports.addAddress = async (req, res) => {
	try {
		const userId = req.user.id;
		const {
			firstName,
			lastName,
			country,
			companyName,
			streetAddress,
			aptSuite,
			city,
			state,
			postalCode,
			phone,
			deliveryInstruction,
			isDefaultBilling,
			isDefaultShipping
		} = req.body;

		// Validate required fields
		if (!firstName || !lastName || !country || !streetAddress || !city || !state || !postalCode || !phone) {
			return res.status(400).json({
				success: false,
				error: 'Missing required fields: firstName, lastName, country, streetAddress, city, state, postalCode, phone'
			});
		}

		// Create new address object
		const newAddress = {
			firstName,
			lastName,
			country,
			companyName,
			streetAddress,
			aptSuite,
			city,
			state,
			postalCode,
			phone,
			deliveryInstruction,
			isDefaultBilling,
			isDefaultShipping
		};

		// Add address to user's addresses array
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ $push: { addresses: newAddress } },
			{ new: true, runValidators: true }
		).select('-password -__v');

		if (!updatedUser) {
			return res.status(404).json({
				success: false,
				error: 'User not found'
			});
		}

		// Get the newly added address (last one in the array)
		const addedAddress = updatedUser.addresses[updatedUser.addresses.length - 1];

		return res.status(201).json({
			success: true,
			message: 'Address added successfully',
			data: addedAddress
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to add address',
			message: error.message
		});
	}
};

// Get user addresses
exports.getAddresses = async (req, res) => {
	try {
		const userId = req.user.id;

		const user = await User.findById(userId).select('addresses');
		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'User not found'
			});
		}

		return res.json({
			success: true,
			data: user.addresses
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to fetch addresses',
			message: error.message
		});
	}
};

// Update address
exports.updateAddress = async (req, res) => {
	try {
		const userId = req.user.id;
		const { addressId } = req.params;
		const updateData = req.body;

		// Find user and update specific address
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'User not found'
			});
		}

		// Find the address to update
		const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
		if (addressIndex === -1) {
			return res.status(404).json({
				success: false,
				error: 'Address not found'
			});
		}

		// Update the address
		Object.keys(updateData).forEach(key => {
			if (updateData[key] !== undefined) {
				user.addresses[addressIndex][key] = updateData[key];
			}
		});

		await user.save();

		return res.json({
			success: true,
			message: 'Address updated successfully',
			data: user.addresses[addressIndex]
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Failed to update address',
			message: error.message
		});
	}
};

// // Delete address
// exports.deleteAddress = async (req, res) => {
// 	try {
// 		const userId = req.user.id;
// 		const { addressId } = req.params;

// 		const updatedUser = await User.findByIdAndUpdate(
// 			userId,
// 			{ $pull: { addresses: { _id: addressId } } },
// 			{ new: true }
// 		);

// 		if (!updatedUser) {
// 			return res.status(404).json({
// 				success: false,
// 				error: 'User not found'
// 			});
// 		}

// 		return res.json({
// 			success: true,
// 			message: 'Address deleted successfully'
// 		});
// 	} catch (error) {
// 		return res.status(500).json({
// 			success: false,
// 			error: 'Failed to delete address',
// 			message: error.message
// 		});
// 	}
// };

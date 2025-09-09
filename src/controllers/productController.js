const Product = require('../models/product.model');
const { uploadColorImages, processAndSaveImages } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// Create a new product
exports.createProduct = [
	uploadColorImages,
	async (req, res) => {
		try {
			const {
				name,
				brand,
				category,
				subCategory,
				description,
				features,
				price,
				stock,
				estimatedDelivery,
				status = 'Draft',
				freeShipping = false,
				returnAvailable = false,
				sizes = [],
				colors = []
			} = req.body;

			// Parse JSON fields if they are strings
			const parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;
			const parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
			let parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;

			// Generate unique product ID
			const productId = `PROD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			// Transform sizes array to match schema
			const transformedSizes = parsedSizes.map(size => ({
				size: size,
				available: true
			}));

			// Process color images if any
			let transformedColors = parsedColors.map(color => ({
				name: color.name,
				hexCode: color.hex || color.hexCode || '#000000',
				image: ''
			}));

			if (req.files && req.files.length > 0) {
				//console.log('Files received:', req.files.map(f => ({ fieldname: f.fieldname, filename: f.filename })));
				//console.log('Colors count:', parsedColors.length);

				// Process each file and match it to the correct color
				for (let i = 0; i < req.files.length; i++) {
					const file = req.files[i];
					//console.log(`Processing file ${i}:`, { fieldname: file.fieldname, filename: file.filename, path: file.path });

					// Extract color index from fieldname (e.g., "colorImage_0" or "colors[0][image]")
					const match = file.fieldname.match(/colorImage_(\d+)/) || file.fieldname.match(/colors\[(\d+)\]\[image\]/);
					//console.log('Fieldname match result:', match);

					if (match) {
						const colorIndex = parseInt(match[1]);
						//console.log(`Color index: ${colorIndex}, transformedColors length: ${transformedColors.length}`);

						if (colorIndex < transformedColors.length) {
							//console.log('Processing image for color index:', colorIndex);
							// Process this single file
							const processedImage = await processAndSaveImages([file], [colorIndex]);
							//console.log('Processed image result:', processedImage);

							if (processedImage[0]) {
								transformedColors[colorIndex].image = processedImage[0].url;
								//console.log(`Added image to color ${colorIndex}:`, processedImage[0].url);
							} else {
								//console.log('No processed image returned');
							}
						} else {
							//console.log('Color index out of range');
						}
					} else {
						//console.log('No match found for fieldname pattern');
					}
				}
				//console.log('Final transformed colors:', transformedColors);
			}

			// Create new product
			const product = new Product({
				id: productId,
				name,
				brand,
				category,
				subCategory,
				description,
				features: parsedFeatures,
				price: {
					amount: parseFloat(price),
					currency: 'USD'
				},
				stock: parseInt(stock, 10),
				shipping: {
					freeShipping: freeShipping === 'true' || freeShipping === true,
					returnAvailable: returnAvailable === 'true' || returnAvailable === true,
					estimatedDelivery
				},
				sizes: transformedSizes,
				colors: transformedColors
			});

			// Save product to database
			await product.save();

			res.status(201).json({
				success: true,
				message: 'Product created successfully',
				data: product
			});

		} catch (error) {
			console.error('Error creating product:', error);
			res.status(500).json({
				success: false,
				message: 'Error creating product',
				error: error.message
			});
		}
	}
];

// Get all products
exports.getAllProducts = async (req, res) => {
	try {
		const products = await Product.find({}).sort({ createdAt: -1 });
		res.status(200).json({
			success: true,
			count: products.length,
			data: products
		});
	} catch (error) {
		console.error('Error fetching products:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching products',
			error: error.message
		});
	}
};

// Get product by ID
exports.getProductById = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (!product) {
			return res.status(404).json({
				success: false,
				message: 'Product not found'
			});
		}
		res.status(200).json({
			success: true,
			data: product
		});
	} catch (error) {
		console.error('Error fetching product:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching product',
			error: error.message
		});
	}
};

// Update product
exports.updateProduct = async (req, res) => {
	try {
		// Handle file uploads if any
		await new Promise((resolve, reject) => {
			uploadColorImages(req, res, (err) => {
				if (err) reject(err);
				else resolve();
			});
		});

		const updates = { ...req.body };

		// Process updates for nested objects
		if (updates.features && typeof updates.features === 'string') {
			updates.features = JSON.parse(updates.features);
		}

		if (updates.sizes && typeof updates.sizes === 'string') {
			updates.sizes = JSON.parse(updates.sizes);
		}

		if (updates.colors && typeof updates.colors === 'string') {
			updates.colors = JSON.parse(updates.colors);
		}

		// Process color images if any
		if (req.files && req.files.length > 0) {
			const colorIndexes = updates.colors ?
				updates.colors.map((_, index) => index) : [];

			const processedImages = await processAndSaveImages(req.files, colorIndexes);

			// Update colors with new image paths
			updates.colors = updates.colors.map((color, index) => ({
				...color,
				image: processedImages[index] ? {
					url: `/uploads/products/processed/${processedImages[index].filename}`,
					...processedImages[index]
				} : (color.image || {})
			}));
		}

		// Convert string booleans to actual booleans
		if (updates.freeShipping !== undefined) {
			updates.freeShipping = updates.freeShipping === 'true' || updates.freeShipping === true;
		}

		if (updates.returnAvailable !== undefined) {
			updates.returnAvailable = updates.returnAvailable === 'true' || updates.returnAvailable === true;
		}

		// Update the product
		const product = await Product.findByIdAndUpdate(
			req.params.id,
			{ $set: updates },
			{ new: true, runValidators: true }
		);

		if (!product) {
			return res.status(404).json({
				success: false,
				message: 'Product not found'
			});
		}

		res.status(200).json({
			success: true,
			message: 'Product updated successfully',
			data: product
		});

	} catch (error) {
		console.error('Error updating product:', error);
		res.status(500).json({
			success: false,
			message: 'Error updating product',
			error: error.message
		});
	}
};

// Delete product
exports.deleteProduct = async (req, res) => {
	try {
		const product = await Product.findByIdAndDelete(req.params.id);

		if (!product) {
			return res.status(404).json({
				success: false,
				message: 'Product not found'
			});
		}

		// Remove associated images from filesystem
		if (product.colors && product.colors.length > 0) {
			const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
			product.colors.forEach(color => {
				const value = color && color.image ? String(color.image) : '';
				if (!value) return;
				let pathname = value;
				try {
					if (value.startsWith('http')) {
						pathname = new URL(value).pathname;
					}
				} catch { }
				// Ensure it begins with /uploads; if not, skip
				if (!pathname.startsWith('/uploads/')) return;
				const relative = pathname.replace(/^\/uploads\//, '');
				const imagePath = path.join(uploadsRoot, relative);
				fs.unlink(imagePath, (err) => {
					if (err && err.code !== 'ENOENT') {
						console.error(`Failed to delete image: ${imagePath}`, err.message);
					}
				});
			});
		}

		res.status(200).json({
			success: true,
			message: 'Product and images deleted successfully'
		});
	} catch (error) {
		console.error('Error deleting product:', error);
		res.status(500).json({
			success: false,
			message: 'Error deleting product',
			error: error.message
		});
	}
};


// Get products by category
exports.getProductsByCategory = async (req, res) => {
	try {
		const { category } = req.params;
		const products = await Product.find({ category });

		res.status(200).json({
			success: true,
			count: products.length,
			data: products
		});
	} catch (error) {
		console.error('Error fetching products by category:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching products by category',
			error: error.message
		});
	}
};

exports.getProductsForAdmin = async (req, res) => {
	try {
		const products = await Product.find().sort({ createdAt: -1 });

		const formattedProducts = products.map(prod => ({
			_id: prod._id,
			name: prod.name,
			category: prod.category,
			price: prod.price.amount, // only the number
			image: prod.colors.length > 0 ? prod.colors[0].image : null
		}));

		res.status(200).json({
			success: true,
			count: formattedProducts.length,
			data: formattedProducts
		});
	} catch (error) {
		console.error('Error fetching products:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching products',
			error: error.message
		});
	}
};
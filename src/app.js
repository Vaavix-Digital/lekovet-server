const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { isProduction } = require('./config');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const { errorHandler } = require('./middleware/error');

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());
if (!isProduction) {
	app.use(morgan('dev'));
}

// Serve static files from uploads directory
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Health
app.get('/api/health', (req, res) => {
	res.json({ status: 'ok' });
});

// Feature routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/categories', categoryRoutes);

// Centralized error handler (last)
app.use(errorHandler);

module.exports = app;


